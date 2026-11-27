/**
 * INTERACTION WALLS
 * =================
 *
 * Interaction reach is a distance check (interactions.js), and rooms sit close
 * enough that an object or NPC on the far side of a dividing wall can be in
 * range: m01's Sarah, at the reception desk below the main office wall, could
 * be talked to from inside the main office. This module adds "and no wall is in
 * the way" to every reach check.
 *
 * It reuses the walls-only grids of npc-sight-occlusion.js
 * (window.npcSightOcclusion.isWallClearBetween): wall tiles and closed doors,
 * not props (you use a desk or cabinet from beside it). The back wall is
 * marked by its foot only, since the room to the north walks over that wall
 * face in the 3/4 view (buildRoomSightGrid).
 *
 * The line runs from the player's feet to the target's floor point:
 *   - an NPC: its feet (body centre);
 *   - an object: the bottom edge of its sprite, at the x nearest the player.
 * Either is then pulled inside its own room's floor, so a noticeboard or
 * terminal hung on the back wall, or a prop pushed into a side wall, is reached
 * from the floor in front of it. The grid walk ignores the cells holding the
 * two end points.
 *
 * Doors are never wall-checked: a door is the opening in the wall.
 *
 * SAME-ROOM RULE. The top-down view fakes depth: a room's top two wall rows
 * overlap the bottom of the room to its north, and the player may walk there
 * ("behind" the wall), overlapping the south room's objects. They must not
 * interact with those, because those objects belong to another room. So every
 * reach check also needs the player's feet to be in the target's room, decided
 * the way core/rooms.js updatePlayerRoom decides the player's room (a room's
 * floor starts below its two wall rows, so the strip behind a south room's back
 * wall counts as the north room). Doors are exempt: they join two rooms. A feet
 * point in no room (a gap) or a target with no known room is not blocked.
 *
 * No imports, so the node tests can load this file on its own.
 */

const TILE = 32;
const BACK_WALL_ROWS = 2;   // constants.js VISUAL_TOP_TILES
const SOUTH_EDGE = 8;       // the south wall row's collision strip (collision.js)
const INSET = 2;            // px inside the floor edge

function roomsMap() {
    return (typeof window !== 'undefined' && window.rooms) || {};
}

function occlusion() {
    return (typeof window !== 'undefined' && window.npcSightOcclusion) || null;
}

/** The room a sprite belongs to: its roomId, or the room listing it. */
export function roomOfTarget(target, rooms = roomsMap()) {
    if (!target) return null;
    if (target.roomId && rooms[target.roomId]) return rooms[target.roomId];
    for (const room of Object.values(rooms)) {
        if (Array.isArray(room?.npcSprites) && room.npcSprites.includes(target)) return room;
        if (room?.objects && target.objectId && room.objects[target.objectId] === target) return room;
    }
    return null;
}

/** The walkable floor of a room (world px), inside its walls. */
export function roomFloorRect(room) {
    const pos = room?.position, map = room?.map;
    if (!pos || !map) return null;
    const tw = map.tileWidth ?? TILE, th = map.tileHeight ?? TILE;
    const cols = map.width ?? Math.round((map.widthInPixels ?? 0) / tw);
    const rows = map.height ?? Math.round((map.heightInPixels ?? 0) / th);
    if (!(cols > 2) || !(rows > BACK_WALL_ROWS + 1)) return null;
    return {
        left: pos.x + tw + INSET,
        right: pos.x + (cols - 1) * tw - INSET,
        top: pos.y + BACK_WALL_ROWS * th + INSET,
        bottom: pos.y + rows * th - SOUTH_EDGE - INSET
    };
}

const FOOT_HALF = 5; // default half body height, for a body centre with no body to measure

/**
 * The room whose floor holds a body centred at (x, y), by updatePlayerRoom's own
 * test (its bottom edge = centre + half its height; floor starts BACK_WALL_ROWS
 * tiles down), or null. `half` is the body's half height: pass the player's
 * (playerFeet() carries it) so this agrees with updatePlayerRoom for any body size.
 */
export function roomIdAtFeet(x, y, rooms = roomsMap(), half = FOOT_HALF) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const feetY = y + (Number.isFinite(half) ? half : FOOT_HALF);
    for (const [id, room] of Object.entries(rooms)) {
        const pos = room?.position, map = room?.map;
        if (!pos || !map) continue;
        const w = map.widthInPixels ?? 0, h = map.heightInPixels ?? 0;
        if (feetY >= pos.y + BACK_WALL_ROWS * TILE && feetY <= pos.y + h && x >= pos.x && x <= pos.x + w) return id;
    }
    return null;
}

/**
 * The id of the room a target belongs to. A door is none (it joins two rooms).
 * An NPC or a movable prop (a kicked chair) belongs to the room it now stands in;
 * any other object belongs to the room that loaded it (sprite.roomId), which keeps
 * a wall fixture on the back wall in its own room.
 */
export function roomIdOfTarget(target, rooms = roomsMap()) {
    if (!target || target.doorProperties) return null;
    if (target._isNPC || target.isSwivelChair) {
        const bc = target.body?.center;
        let at = null;
        if (bc && Number.isFinite(bc.x) && Number.isFinite(bc.y)) at = roomIdAtFeet(bc.x, bc.y, rooms);
        else if (target._isNPC && Number.isFinite(target.x)) at = roomIdAtFeet(target.x, target.y - FOOT_HALF, rooms);
        else if (Number.isFinite(target.x)) {
            const b = spriteBox(target);
            at = roomIdAtFeet(b.x + b.w / 2, b.y + b.h - FOOT_HALF - 1, rooms);
        }
        if (at) return at;
    }
    if (target.roomId && rooms[target.roomId]) return target.roomId;
    const room = roomOfTarget(target, rooms);
    if (room) {
        for (const [id, r] of Object.entries(rooms)) if (r === room) return id;
    }
    return null;
}

// ---- Open doorways (combat and NPC talk) ----------------------------------------------
// Two rooms meet at the foot of a back wall, so feet either side of an OPEN door are in different
// rooms with nothing between them. For combat and NPC conversation such a pair counts as one
// room when the line between the feet passes through the doorway. Door positions come from a
// provider (door-gaps.js registers one in the game; this file has no imports so node tests can
// load it alone): (roomId) => [{ to, direction, x, y }].
let doorwayProvider = null;
export function setDoorwayProvider(fn) { doorwayProvider = typeof fn === 'function' ? fn : null; }

const DOOR_HALF_WIDTH = 16;  // a door tile
const DOOR_DEPTH = 32;       // along the wall: its two wall rows / the wall tile either side

/** Does the segment a-b touch the axis-aligned rect (Liang-Barsky)? */
function segmentHitsRect(a, b, r) {
    let t0 = 0, t1 = 1;
    const dx = b.x - a.x, dy = b.y - a.y;
    for (const [p, q] of [[-dx, a.x - r.left], [dx, r.right - a.x], [-dy, a.y - r.top], [dy, r.bottom - a.y]]) {
        if (p === 0) { if (q < 0) return false; continue; }
        const t = q / p;
        if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
        else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
    return true;
}

/** A closed door sprite between the two rooms (an opened door's sprite is gone, or marked open). */
function doorClosed(roomA, roomB, direction, rooms) {
    for (const [id, other] of [[roomA, roomB], [roomB, roomA]]) {
        for (const d of Object.values(rooms[id]?.doorSprites || {})) {
            const props = d?.doorProperties;
            if (d?.active !== false && props && props.connectedRoom === other && !props.open) return true;
        }
    }
    return false;
}

/** True when the segment between two feet points runs through an open doorway joining the two rooms. */
export function throughOpenDoor(a, b, roomA, roomB, rooms = roomsMap()) {
    if (!doorwayProvider || !roomA || !roomB || roomA === roomB) return false;
    let doors;
    try { doors = doorwayProvider(roomA) || []; } catch (e) { return false; }
    for (const d of doors) {
        if (d.to !== roomB) continue;
        const side = d.direction === 'east' || d.direction === 'west';
        const rect = side
            ? { left: d.x - DOOR_DEPTH, right: d.x + DOOR_DEPTH, top: d.y - DOOR_HALF_WIDTH, bottom: d.y + DOOR_HALF_WIDTH }
            : { left: d.x - DOOR_HALF_WIDTH, right: d.x + DOOR_HALF_WIDTH, top: d.y - DOOR_DEPTH, bottom: d.y + DOOR_DEPTH };
        if (segmentHitsRect(a, b, rect) && !doorClosed(roomA, roomB, d.direction, rooms)) return true;
    }
    return false;
}

/** The room of a feet point; in a gap, its `fallback` room (the player's last room, an NPC's home). */
function roomOfPoint(p, rooms) {
    const id = roomIdAtFeet(p.x, p.y, rooms, p.half);
    if (id) return id;
    const fb = p.fallback ?? (p.isPlayer && typeof window !== 'undefined' ? window.currentPlayerRoom : null);
    return fb && rooms[fb] ? fb : null;
}

/**
 * True unless the feet at `from` stand in one room and the target belongs to
 * another. See SAME-ROOM RULE above.
 */
export function sameRoomFrom(from, target, rooms = roomsMap()) {
    if (!from || !target || target.doorProperties) return true;
    // Feet in no room (a gap): judge by the last room the player was in, so a gap
    // is not a way round the rule
    const here = roomOfPoint({ isPlayer: true, ...from }, rooms);
    if (!here) return true;
    const there = roomIdOfTarget(target, rooms);
    return !there || there === here;
}

function spriteBox(s) {
    const w = s.displayWidth ?? s.width ?? 0;
    const h = s.displayHeight ?? s.height ?? 0;
    const ox = s.originX ?? 0.5, oy = s.originY ?? 0.5;
    return { x: s.x - ox * w, y: s.y - oy * h, w, h };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** The player's feet (body centre), or the sprite position. */
export function playerFeet(player) {
    const c = player?.body?.center;
    if (c && Number.isFinite(c.x) && Number.isFinite(c.y)) {
        const half = Number.isFinite(player.body.halfHeight) ? player.body.halfHeight
            : Number.isFinite(player.body.height) ? player.body.height / 2 : FOOT_HALF;
        return { x: c.x, y: c.y, half, isPlayer: true };
    }
    if (player && Number.isFinite(player.x)) return { x: player.x, y: player.y };
    return null;
}

/** Where the reach line ends on a target, seen from the floor point `from`. */
export function interactionTargetPoint(target, from, room) {
    if (!target) return null;
    if (!room) {
        // The room it stands in now (an NPC that changed rooms), else its home room
        const id = roomIdOfTarget(target);
        room = (id && roomsMap()[id]) || roomOfTarget(target);
    }
    let p;
    const bc = target.body?.center;
    if (target._isNPC && bc && Number.isFinite(bc.x) && Number.isFinite(bc.y)) {
        p = { x: bc.x, y: bc.y };
    } else {
        const b = spriteBox(target);
        if (b.w > 0 && b.h > 0) {
            const fx = from && Number.isFinite(from.x) ? from.x : b.x + b.w / 2;
            p = { x: clamp(fx, b.x + 1, b.x + b.w - 1), y: b.y + b.h - 1 };
        } else if (Number.isFinite(target.x)) {
            p = { x: target.x, y: target.y };
        } else {
            return null;
        }
    }
    const f = roomFloorRect(room);
    if (f && f.left < f.right && f.top < f.bottom) {
        p.x = clamp(p.x, f.left, f.right);
        p.y = clamp(p.y, f.top, f.bottom);
    }
    return p;
}

/**
 * True when no wall or closed door stands between the floor point `from` and the
 * target. With no occlusion module loaded it says true (old behaviour).
 */
export function wallClearFrom(from, target, opts = {}) {
    const { room, occ = occlusion() } = opts;
    if (!from || !target) return true;
    if (target.doorProperties) return true;
    if (!sameRoomFrom(from, target)) {
        // Different room (see SAME-ROOM RULE). Combat and NPC conversation make an exception
        // for an open doorway between the two rooms, with a clear line through it.
        const combat = opts.combat ?? !!target._isNPC;
        if (!combat) return false;
        const rooms = roomsMap();
        const here = roomOfPoint({ isPlayer: true, ...from }, rooms);
        const there = roomIdOfTarget(target, rooms);
        const toPt = interactionTargetPoint(target, from, rooms[there]);
        if (!here || !there || !toPt || !throughOpenDoor(from, toPt, here, there, rooms)) return false;
        return !occ || typeof occ.isWallClearBetween !== 'function' || occ.isWallClearBetween(from, toPt);
    }
    if (!occ || typeof occ.isWallClearBetween !== 'function') return true;
    const to = interactionTargetPoint(target, from, room);
    if (!to) return true;
    return occ.isWallClearBetween(from, to);
}

/**
 * True when two feet points (body centres: an NPC and the player, say) stand in
 * the same room and no wall stands between them. For an NPC attack: nobody
 * punches through a wall, or through the strip behind a back wall into the room
 * below. A point in no room (a gap) is judged by the wall test alone.
 */
export function feetClear(a, b, { occ = occlusion(), rooms = roomsMap() } = {}) {
    if (!a || !b) return true;
    const ra = roomOfPoint(a, rooms);
    const rb = roomOfPoint(b, rooms);
    if (ra && rb && ra !== rb && !throughOpenDoor(a, b, ra, rb, rooms)) return false; // a gap (no room) is left to the wall test
    if (!occ || typeof occ.isWallClearBetween !== 'function') return true;
    return occ.isWallClearBetween({ x: a.x, y: a.y }, { x: b.x, y: b.y });
}

/** True when no wall or closed door stands between the player and the target. */
export function interactionLineClear(player, target, opts = {}) {
    return wallClearFrom(playerFeet(player), target, opts);
}

/**
 * A feet position the player can walk to and use `target` from: within `range`
 * of it (sprite centre to target centre, as interactions.js measures) and with
 * no wall between. Shortest straight walk wins. pfm: the pathfinding manager
 * (findNearestWalkableWorldCell). Null when nothing fits.
 */
export function findClearStandPoint(target, player, pfm, range, opts = {}) {
    if (!target || !player || !pfm?.findNearestWalkableWorldCell) return null;
    const feet = playerFeet(player);
    if (!feet) return null;
    const footDx = feet.x - player.x, footDy = feet.y - player.y;
    const room = opts.room;
    const reachOf = opts.reachOf || ((c) => Math.hypot(c.x - footDx - target.x, c.y - footDy - target.y));
    // Walkable cells are coarse (a desk in front of the target can leave the
    // nearest one ~28px off), so allow up to 1px short of the full range
    const maxReach = opts.maxReach ?? range - 1;
    let best = null, bestWalk = Infinity;
    const seen = new Set();
    for (const r of [0, 8, 16, 24, 32]) {
        const steps = r === 0 ? 1 : 16;
        for (let a = 0; a < steps; a++) {
            const ang = (a / steps) * Math.PI * 2;
            const c = pfm.findNearestWalkableWorldCell(
                target.x + Math.cos(ang) * r + footDx, target.y + Math.sin(ang) * r + footDy, 3);
            if (!c) continue;
            const key = `${Math.round(c.x)},${Math.round(c.y)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            if (reachOf(c) > maxReach) continue;
            if (!wallClearFrom({ x: c.x, y: c.y, half: feet.half }, target, { room, occ: opts.occ })) continue;
            const walk = Math.hypot(c.x - feet.x, c.y - feet.y);
            if (walk < bestWalk) { best = { x: c.x, y: c.y }; bestWalk = walk; }
        }
    }
    return best;
}

if (typeof window !== 'undefined') {
    window.interactionWalls = { feetClear, throughOpenDoor, setDoorwayProvider, sameRoomFrom, roomIdAtFeet, roomIdOfTarget, interactionLineClear, wallClearFrom, interactionTargetPoint, findClearStandPoint };
}
