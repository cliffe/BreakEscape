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
 * that part. The vertical measure is the sprite's y, which keeps every
 * existing stand point valid; this only ever shortens a reach. reachY() is
 * the vertical counterpart, and applies to every scenario object: a tall prop
 * against the back wall (a 47px filing cabinet) is reached at its footprint,
 * not its top edge, which a player's feet cannot get within 32px of.
 *
 * Doors and NPCs keep their own measures (DOOR_INTERACTION_RANGE_SQ,
 * npc-reach.js). No imports, so the node tests can load this file on its own.
 */

/** Objects at least this tall (px) are reached at their footprint, not their top edge (reachY). */
export const TALL_PROP_PX = 32;

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
 * The y to measure reach to for `sprite`, seen from player y `fromY`: the
 * vertical counterpart of reachX. The player's y is clamped into the sprite's
 * vertical span, so standing level with any part of it counts as being at that
 * part. A scenario object's origin is its top-left, so measuring to sprite.y
 * put a floor-standing 47px cabinet against the back wall (m01 derek_cabinet)
 * about 27px beyond the nearest the player's feet can reach, and the walk
 * stopped short. This applies to every scenario object at least TALL_PROP_PX (32) tall,
 * or marked "wallMounted"; shorter props, doors, NPCs, rotated sprites and sprites without
 * scenario data keep sprite.y. Like reachX it only ever shortens a reach: the
 * clamped point is never further from fromY than sprite.y is. It does not
 * loosen the wall rule: interactionLineClear still runs the line to the base
 * of the object, in the object's own room.
 */
export function reachY(sprite, fromY) {
    if (!sprite || !Number.isFinite(sprite.y)) return sprite ? sprite.y : 0;
    if (sprite._isNPC || sprite.doorProperties || !sprite.scenarioData) return sprite.y;
    if (!Number.isFinite(fromY) || sprite.rotation) return sprite.y;
    const h = sprite.displayHeight ?? sprite.height ?? 0;
    // Only a tall prop needs it: a low one (under 32px: a short box, a desk top) is near enough its top edge, and
    // the overlap and pick logic is tuned to that measure. A "wallMounted" mark always opts in.
    if (!(h >= TALL_PROP_PX || (h > 0 && sprite.scenarioData.wallMounted === true))) return sprite.y;
    const top = sprite.y - (sprite.originY ?? 0.5) * h;
    return Math.max(top, Math.min(fromY, top + h));
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
 * The y to aim the facing angle at: the vertical centre of the object, the
 * counterpart of aimX. A scenario object's origin is its top-left, so aiming at
 * sprite.y read a short prop's top edge as far off the player's facing (the
 * 30px safe beside the 47px cabinet in m01). Doors, NPCs and sprites without
 * scenario data keep sprite.y.
 */
export function aimY(sprite) {
    if (!sprite || !Number.isFinite(sprite.y)) return sprite ? sprite.y : 0;
    if (sprite._isNPC || sprite.doorProperties || !sprite.scenarioData) return sprite.y;
    if (sprite.rotation && typeof sprite.getBounds === 'function') {
        try {
            const b = sprite.getBounds();
            if (b && b.height > 0) return b.centerY ?? (b.top + b.height / 2);
        } catch (e) { /* fall through */ }
    }
    const h = sprite.displayHeight ?? sprite.height ?? 0;
    if (!(h > 0)) return sprite.y;
    return sprite.y - (sprite.originY ?? 0.5) * h + h / 2;
}

/** Scenario objects shorter than this (px) may be aimed at from the body to the top edge (aimDiff). */
export const BODY_AIM_MAX_PX = 40;

/**
 * How far off the player's facing a scenario object is, and the aim point that gave it (E and the E label
 * both score with this, so they cannot disagree). The aim is the feet to the object's centre. A prop shorter
 * than BODY_AIM_MAX_PX also gets the older body-to-top-edge aim, and the smaller angle wins: a player level
 * with a low prop beside them faces it from the body, which the feet angle alone calls 45 degrees off. Taller
 * props never use the body aim: its angle to a tall top edge reads almost straight up and beat a short
 * neighbour's feet angle. Not for doors or NPCs. `facingAngle` is degrees, right 0, down 90.
 * Returns { diff, x, y, fromX, fromY }.
 */
export function aimDiff(player, target, faceX, faceY, facingAngle) {
    const c = player?.body?.center;
    const foot = c && Number.isFinite(c.x) && Number.isFinite(c.y) ? c : { x: player.x, y: player.y };
    const diffFrom = (x, y, fromX, fromY) => {
        let a = Math.atan2(y - fromY, x - fromX) * 180 / Math.PI;
        a = (a + 360) % 360;
        let d = Math.abs(facingAngle - a);
        if (d > 180) d = 360 - d;
        return d;
    };
    const feetAim = { x: faceX, y: faceY, fromX: foot.x, fromY: foot.y };
    feetAim.diff = diffFrom(feetAim.x, feetAim.y, feetAim.fromX, feetAim.fromY);
    const h = target?.displayHeight ?? target?.height ?? 0;
    if (h >= BODY_AIM_MAX_PX || !Number.isFinite(target?.y)) return feetAim;
    const bodyAim = { x: faceX, y: target.y, fromX: player.x, fromY: player.y };
    bodyAim.diff = diffFrom(bodyAim.x, bodyAim.y, bodyAim.fromX, bodyAim.fromY);
    return feetAim.diff <= bodyAim.diff ? feetAim : bodyAim;
}

/** Scenario object types that are a desk computer (trailing digits are stripped first: laptop1, pc10, pc3). */
const DESK_COMPUTER_TYPES = new Set(['pc', 'workstation', 'laptop', 'mail_terminal', 'log_filter_terminal', 'ops_log_terminal', 'drug_library_terminal']);

/** A seated player's computer must lie within this many degrees of the way they face. */
export const SEATED_PC_FRONT_DEG = 70;

/** Facing angle in degrees (right 0, down 90) for a player.direction; an unknown direction faces down. */
export function directionAngle(dir) {
    switch (dir) {
        case 'right':      return 0;
        case 'down-right': return 45;
        case 'down':       return 90;
        case 'down-left':  return 135;
        case 'left':       return 180;
        case 'up-left':    return 225;
        case 'up':         return 270;
        case 'up-right':   return 315;
        default:           return 90;
    }
}

/** True for a scenario object that is a computer at a desk (type pc, workstation, laptop or a *_terminal PC). */
export function isDeskComputer(sprite) {
    const type = sprite?.scenarioData?.type;
    return !!sprite && !sprite._isNPC && !sprite.doorProperties && typeof type === 'string' && DESK_COMPUTER_TYPES.has(type.replace(/\d+$/, ''));
}

/**
 * reachY for the reach tests, with one addition: a seated player reaches the desk computer in front of them at its
 * footprint, like a tall prop (a 27px monitor on Gary's desk is 48px from the seat by its top edge, beyond the 32px
 * reach, but sits right in front of him). "In front" is the same test as isSeatedDeskPc (within SEATED_PC_FRONT_DEG
 * of player.direction), so a neighbour's computer to the side gains no reach. Standing, or any other object, is
 * plain reachY. Every reach check (E, the label, the highlight, tap-pick, handleObjectInteraction) calls this so
 * they agree.
 */
export function reachYSeated(sprite, player, seated) {
    const fromY = player?.y;
    if (seated && isDeskComputer(sprite) && Number.isFinite(fromY) && Number.isFinite(sprite.y) && !sprite.rotation) {
        const h = sprite.displayHeight ?? sprite.height ?? 0;
        if (h > 0 && aimDiff(player, sprite, aimX(sprite), aimY(sprite), directionAngle(player.direction)).diff <= SEATED_PC_FRONT_DEG) {
            const top = sprite.y - (sprite.originY ?? 0.5) * h;
            return Math.max(top, Math.min(fromY, top + h));
        }
    }
    return reachY(sprite, fromY);
}

/**
 * Seated at a desk, E and the E label prefer its computer. There is no seat-to-desk link in the scenarios, so
 * "the seat's desk PC" is a computer the player can already reach (the callers' reach and wall tests) that lies
 * in front of the way they face: `diff` is its aimDiff, and a PC behind or beside the chair is some other desk's.
 * A fixed seat cannot turn, and a swivel chair turns only to face a way the player chose, so the PC beats every
 * other object in reach, but an NPC that is better aimed than the PC (lower plain score) wins instead, even over a
 * mug that scored best overall: someone sitting across the desk is who E means.
 * `seated` is window.seating.currentSeat(); the callers keep the best such PC apart from their plain best, and the
 * best NPC apart again (seatedPcWins).
 */
export function isSeatedDeskPc(seated, target, diff) {
    return !!seated && isDeskComputer(target) && Number.isFinite(diff) && diff <= SEATED_PC_FRONT_DEG;
}

/** Whether the best seated PC (plain score `pcScore`) beats the best NPC (plain score `bestNpcScore`, Infinity when none). */
export function seatedPcWins(pcScore, bestNpcScore) {
    if (!Number.isFinite(pcScore)) return false;
    return !(bestNpcScore < pcScore);
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

/**
 * The far-tap counterpart of withoutChairsIfOthers (USB habit review R3 m1). A tap out of
 * reach acts on the first interactable sprite under it, in depth order, and a chair drawn
 * above an item lying on the floor under or beside it took the tap: the player walked to
 * the chair, the sit could not finish, and "Can't reach that seat from here." showed. A
 * takeable item under the same tap now comes before any chair (a seat or a swivel prop),
 * so the walk goes to the item, as an in-reach tap already does. The order is otherwise
 * kept, and a tap with no takeable item, or no chair, is unchanged.
 *
 * @param {Array} sprites - sprites under the tap, in the order they would be tried
 * @param {(sprite:any) => boolean} isChair
 * @returns {Array} the same sprites, takeable items moved ahead of the chairs
 */
export function takeablesBeforeChairs(sprites, isChair) {
    if (!Array.isArray(sprites)) return [];
    const usable = (s) => !!s && s.interactable;
    const takeable = (s) => usable(s) && s.scenarioData?.takeable === true && !isChair(s);
    const firstChair = sprites.findIndex(s => usable(s) && isChair(s));
    if (firstChair < 0 || !sprites.some(takeable)) return sprites;
    const lifted = sprites.filter((s, i) => i > firstChair && takeable(s));
    if (!lifted.length) return sprites;
    const rest = sprites.filter(s => !lifted.includes(s));
    return [...rest.slice(0, firstChair), ...lifted, ...rest.slice(firstChair)];
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

/**
 * The NPCs sitting on a seat. A one-place chair holds its occupant in chair.seatedBy (set by
 * seating.js when an NPC takes or reserves it); a sofa or bench with several places keeps one
 * entry per place in chair._places and reads seatedBy 'full' only once every place is taken, so
 * both are read. A click or E on that person is for the person: "A chair." is wrong when the
 * centre of a seated NPC is clicked, and the chair's reach (its nearest edge) differs from hers
 * (her centre), so a player in reach of the seat but not of her used to get the seat.
 *
 * @param {?object} seat - the chair sprite (seatedBy, _places)
 * @param {Array<object>} npcSprites - NPC sprites to look through (npcId, visible, destroyed, active)
 * @param {object} [deps]
 * @param {function(object): boolean} [deps.isKo] - the NPC is knocked out (she is not a person to talk to)
 * @param {function(object, object): boolean} [deps.isSeated] - (npc, seat): she is actually on it now, not
 *   just holding a reservation while she walks over (seating.js reserves swivel chairs early)
 * @returns {Array<object>}
 */
export function seatOccupants(seat, npcSprites, deps = {}) {
    if (!seat || !Array.isArray(npcSprites)) return [];
    const ids = new Set(Object.values(seat._places || {}));
    if (seat.seatedBy) ids.add(seat.seatedBy);
    ids.delete('full');
    ids.delete('player');
    if (!ids.size) return [];
    return npcSprites.filter(n => n && ids.has(n.npcId) && !n.destroyed && n.visible !== false && n.active !== false
        && !(deps.isKo && deps.isKo(n)) && (!deps.isSeated || deps.isSeated(n, seat)));
}

/** The first NPC sitting on a seat (seatOccupants), or null. */
export function seatOccupant(seat, npcSprites, deps = {}) {
    return seatOccupants(seat, npcSprites, deps)[0] || null;
}

/**
 * Whether a tap on an NPC-occupied seat is for an occupant (seatOccupants): that occupant's
 * frame holds the tap and the tap is on her figure (deps.npcOnFigure). On a two-place sofa the
 * tap on the free place away from her still reaches the sofa. A tap on the chair away from
 * her (the empty part of its frame) still reaches the chair.
 *
 * @param {object} seat
 * @param {Array<object>} npcsUnderTap - NPC sprites whose frame holds the tap (findNPCsAtPosition)
 * @param {object} deps
 * @param {function(object): boolean} deps.npcOnFigure
 * @param {function(object): boolean} [deps.isKo]
 * @param {function(object, object): boolean} [deps.isSeated]
 * @returns {?object} the occupant, or null
 */
export function occupantUnderTap(seat, npcsUnderTap, deps) {
    return seatOccupants(seat, npcsUnderTap, deps).find(n => deps.npcOnFigure(n)) || null;
}

// ---------------------------------------------------------------------------------------------------------
// The E pick (pickInteractable). E (interactions.js tryInteractWithNearest) and the E label (ui/info-label.js)
// both call it, so what the label names is what E acts on. It lives here, with no imports, so the node tests
// load it alone: what needs the engine (the wall test, the NPC body reach, the range constants) comes in
// through `deps`.
// ---------------------------------------------------------------------------------------------------------

/** The seat an NPC is sitting on now (seating.js keeps it on her behaviour), or null */
export function seatedChairOf(npcSprite) {
    const chair = npcSprite?.npcId ? W().npcBehaviorManager?.getBehavior?.(npcSprite.npcId)?._seat?.chair : null;
    return chair && !chair.destroyed && chair.active !== false ? chair : null;
}

/** She is on this seat now, not just holding its reservation */
export function npcSeatedOn(npcSprite, seat) {
    return seatedChairOf(npcSprite) === seat;
}

// Floor point under place `i` of a sofa or bench (seating.js placeFoot)
function placeFootPoint(chair, places, i) {
    return { x: chair.x + places[i][0], y: chair.y + chair.height };
}

function distSqTo(player, pt) {
    return (pt.x - player.x) ** 2 + (pt.y - player.y) ** 2;
}

// The player's foot point (body centre, as interaction-walls playerFeet): the sprite sits about 25 px above it
function footOf(player) {
    const c = player?.body?.center;
    return c && Number.isFinite(c.x) && Number.isFinite(c.y) ? c : { x: player.x, y: player.y };
}

// How much nearer (px) the player's feet must be to a free place's foot than to her own place's foot before E sits
// there instead of talking to her: standing on or close beside her always talks.
const FREE_PLACE_MARGIN = 10;
// A sofa whose sitter wins E sits behind everything else in score, past the widest aim term (180 deg x 1000)
const SOFA_SITTER_PENALTY = 400000;
/** Added to the score of a seat that is not the one the player sits on, and of an NPC who is leaving: E prefers anything else */
export const SEAT_PENALTY = 30000;

/**
 * The player is clearly nearer a free place of her sofa or bench than her own place (E there sits, not talks).
 * Takes the nearest free place, so it holds for any number of places.
 */
export function nearerFreePlace(player, npcSprite) {
    const chair = seatedChairOf(npcSprite);
    const b = chair ? W().npcBehaviorManager?.getBehavior?.(npcSprite.npcId)?._seat : null;
    const places = b?.seat?.places;
    if (!places || !places[b.place]) return false;
    const taken = chair._places || {};
    const free = places.map((_, i) => i).filter(i => !taken[i]);
    if (!free.length) return false;
    const feet = footOf(player);
    const d = (i) => Math.sqrt(distSqTo(feet, placeFootPoint(chair, places, i)));
    return Math.min(...free.map(d)) + FREE_PLACE_MARGIN < d(b.place);
}

/**
 * A seated NPC is reached from her seat, counted with her centre (the seat's reach is the one the
 * player sees, and the seat can hide her from the centre). A one-place chair counts its nearest
 * edge; a sofa or bench counts her own place's foot only, so its far end does not reach her.
 * Used by E, the label, the talk icon and the tap, so the screen shows what E does.
 */
export function seatedNpcReachDistSq(player, npcSprite, distSq) {
    const chair = seatedChairOf(npcSprite);
    if (!chair) return distSq;
    const b = W().npcBehaviorManager?.getBehavior?.(npcSprite.npcId)?._seat;
    const places = b?.seat?.places;
    if (nearerFreePlace(player, npcSprite)) return Infinity; // the free place is the player's: E sits, so no icon, tap or talk for her
    if (places && places[b.place]) return Math.min(distSq, distSqTo(player, placeFootPoint(chair, places, b.place)));
    const dx = reachX(chair, player.x) - player.x;
    const dy = reachY(chair, player.y) - player.y;
    return Math.min(distSq, dx * dx + dy * dy);
}

/**
 * The nearest thing E would act on: the pick behind tryInteractWithNearest, and the label's. Score is angular
 * closeness (primary, x1000) plus distance; a chair other than the player's own, and an NPC walking away, take
 * +SEAT_PENALTY; a seated player's desk computer wins unless an NPC is better aimed (seatedPcWins).
 *
 * @param {object} player
 * @param {object} deps
 * @param {object} deps.rooms - the rooms map (objects, doorSprites, npcSprites)
 * @param {number} deps.range - INTERACTION_RANGE
 * @param {number} deps.rangeSq - INTERACTION_RANGE_SQ
 * @param {function(object, object, number): number} deps.npcReachDistSq - npc-reach.js
 * @param {function(object, object): boolean} deps.lineClear - interaction-walls.js interactionLineClear
 * @returns {?{kind: 'object'|'door'|'npc', target: object, objX: number, objY: number, fromX: number, fromY: number, score: number}}
 *   objX/objY/fromX/fromY: the aim point and the point it is aimed from (E turns the player by them)
 */
export function pickInteractable(player, deps) {
    const { rooms, range, rangeSq: INTERACTION_RANGE_SQ, lineClear } = deps;
    const reachNpc = deps.npcReachDistSq;
    const INTERACTION_RANGE = range;
    const px = player.x;
    const py = player.y;
    const facingAngle = directionAngle(player.direction || 'down'); // Phaser: right 0, down 90, left 180, up 270

    // The angle is taken from (fromX, fromY): the player's centre by default (NPCs); scenario objects are scored by aimDiff
    function angularDiff(objX, objY, fromX = px, fromY = py) {
        let angle = Math.atan2(objY - fromY, objX - fromX) * 180 / Math.PI;
        angle = (angle + 360) % 360;
        let diff = Math.abs(facingAngle - angle);
        if (diff > 180) diff = 360 - diff;
        return diff;
    }

    let best = null;
    let bestScore = Infinity;
    // The best desk computer in front of a seated player (isSeatedDeskPc), kept apart: it wins over everything but a better-aimed NPC
    let bestPc = null;
    let bestPcScore = Infinity;
    let bestNpc = null; // the best NPC apart: a better-aimed colleague beats the PC even when a mug scored best overall
    let bestNpcScore = Infinity;
    const seatedOn = W().seating?.currentSeat?.() || null;

    // Ids of the objects in reach: an owner on the move from her own PC among them gives way (review R2 m1)
    const inReachIds = [];

    function consider(kind, objX, objY, rangeSq, npcSprite = null, target = npcSprite, faceX = objX, faceY = objY, entity = target) {
        const dx = objX - px;
        const dy = objY - py;
        const plainSq = dx * dx + dy * dy;
        const npcSq = npcSprite ? reachNpc(player, npcSprite, plainSq) : plainSq;
        const distSq = npcSprite ? seatedNpcReachDistSq(player, npcSprite, npcSq) : npcSq; // clearly nearer the free place of a sofa she shares, it returns Infinity: E is for the sofa
        if (distSq > rangeSq) return;
        if (target && !lineClear(player, target)) return; // wall between
        if (target && !npcSprite) inReachIds.push(objectIdOf(target));
        const dist = Math.sqrt(distSq);
        // A scenario object is scored by aimDiff (feet to centre, or the body to the top edge of a short prop when that is the smaller angle)
        let aim = { x: faceX, y: faceY, fromX: px, fromY: py };
        let aimAngle = angularDiff(faceX, faceY);
        if (target && !npcSprite && !target.doorProperties) {
            aim = aimDiff(player, target, faceX, faceY, facingAngle);
            aimAngle = aim.diff;
        }
        let score = aimAngle * 1000 + dist; // angle to the object's aim point, range to its nearest part
        // A chair loses to anything else faced. A sofa whose sitter E would talk to loses to her outright: standing on her
        // figure the aim at her centre is arbitrary (up to 180 x 1000), which the plain penalty would not outweigh.
        if (target && !npcSprite && W().seating?.isSeat(target) && !sofaFreePlaceWins(target)) score += sofaSitterTalkFirst(target) ? SOFA_SITTER_PENALTY : SEAT_PENALTY;
        if (npcSprite && npcGivesWay(player, npcSprite, inReachIds)) score += SEAT_PENALTY; // so does someone walking away (q55 d)
        const pick = { kind, target: entity, objX: aim.x, objY: aim.y, fromX: aim.fromX, fromY: aim.fromY, score };
        if (isSeatedDeskPc(seatedOn, npcSprite ? null : target, aimAngle) && score < bestPcScore) { bestPcScore = score; bestPc = pick; }
        if (npcSprite && score < bestNpcScore) { bestNpcScore = score; bestNpc = pick; }
        if (score < bestScore) { bestScore = score; best = pick; }
    }

    // E/W side doors are centered on their tile but the player stands at floor level (tile bottom).
    // Anchor to the floor of the tile and use a larger range to compensate for the vertical offset.
    const SIDE_DOOR_RANGE_SQ = INTERACTION_RANGE_SQ * 4; // 2x radius
    const SIDE_DOOR_Y_OFFSET = INTERACTION_RANGE / 2;    // half-tile down to floor level

    const npcsToConsider = [];
    let npcList = null;
    const allNpcs = () => npcList || (npcList = Object.values(rooms).flatMap(r => r.npcSprites || []));
    const npcKo = (n) => !!W().npcHostileSystem?.isNPCKO?.(n.npcId);
    const sittersOn = (seat) => allNpcs().filter(n => n.active !== false && !npcKo(n) && npcSeatedOn(n, seat));
    // A sofa with sitters, the player clearly nearer a free place than every one of their places (E sits there). Any number of places:
    // one sitter the player is not clearly away from keeps E for her.
    const sofaFreePlaceWins = (seat) => {
        if (!seat._places) return false;
        const sitters = sittersOn(seat);
        return sitters.length > 0 && sitters.every(n => nearerFreePlace(player, n));
    };
    // A sitter on this sofa that E would talk to: in her reach, and the player not clearly nearer a free place
    const sofaSitterTalkFirst = (seat) => !!seat._places && sittersOn(seat).some(n => !nearerFreePlace(player, n)
        && seatedNpcReachDistSq(player, n, reachNpc(player, n, (n.x - px) ** 2 + (n.y - py) ** 2)) <= INTERACTION_RANGE_SQ);
    Object.values(rooms).forEach(room => {
        if (room.objects) {
            Object.values(room.objects).forEach(obj => {
                if (!obj.active || !obj.interactable || !obj.visible) return;
                if (seatedOn && obj === seatedOn) return; // E from a chair reaches what's around it
                // A seat with no free place whose sitter (any of them, on a full sofa) is on it now is her, not "A chair." (seatOccupant);
                // she is considered below. A sofa with a free place stays, and loses to her by score.
                if (obj.seatedBy && W().seating?.isSeat(obj) && seatOccupant(obj, allNpcs(), { isKo: npcKo, isSeated: npcSeatedOn })) return;
                consider('object', reachX(obj, px), reachYSeated(obj, player, seatedOn), INTERACTION_RANGE_SQ, null, obj, aimX(obj), aimY(obj));
            });
        }

        if (room.doorSprites) {
            Object.values(room.doorSprites).forEach(door => {
                if (!door.active || !door.doorProperties) return;
                const dir = door.doorProperties.direction;
                if (dir === 'east' || dir === 'west') {
                    consider('door', door.x, door.y + SIDE_DOOR_Y_OFFSET, SIDE_DOOR_RANGE_SQ, null, null, door.x, door.y + SIDE_DOOR_Y_OFFSET, door); // doors: no wall test, as before
                } else {
                    consider('door', door.x, door.y, INTERACTION_RANGE_SQ, null, null, door.x, door.y, door);
                }
            });
        }

        if (room.npcSprites) {
            room.npcSprites.forEach(sprite => {
                if (!sprite.active || !sprite._isNPC || !sprite.visible) return;
                if (sprite.npcId && W().npcHostileSystem && W().npcHostileSystem.isNPCKO(sprite.npcId)) return;
                npcsToConsider.push(sprite);
            });
        }
    });
    // NPCs last, once every object in reach is known (inReachIds)
    npcsToConsider.forEach(sprite => consider('npc', sprite.x, sprite.y, INTERACTION_RANGE_SQ, sprite));

    if (bestPc) best = seatedPcWins(bestPcScore, bestNpcScore) ? bestPc : bestNpc; // the PC, or the NPC that is better aimed than it
    return best;
}
