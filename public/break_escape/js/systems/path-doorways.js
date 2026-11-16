/**
 * Doorway waypoints for click-to-move paths (pure functions, no imports, so
 * they can be unit-tested in node: test/js/path-doorways.test.mjs).
 *
 * The player's feet collider is 18x10. A side (E/W) doorway leaves a gap only
 * 24px tall (collision.js puts 8px bars on the top and bottom faces of the
 * opening), and an N/S doorway is one tile (32px) wide and two tiles deep. A
 * path that reaches the opening on a diagonal, or that the player starts
 * turning onto early, clips the frame; once the body is touching the frame
 * the straight-line leg of a move stops dead (player.js cancels straight-line
 * movement on any contact).
 *
 * So when a path crosses a doorway, three waypoints are pinned into it, all on
 * the opening's centre line: one square in front of the opening, one at its
 * centre, one past it. Smoothing may not skip them and the player has to reach
 * each one, so the body always enters and leaves the doorway straight.
 */

/**
 * Distance of the near and far points from the opening's centre.
 * E/W: the opening is both rooms' wall columns (64px deep, centred on the
 * boundary), so 44 = 32 + 12 puts the 18px-wide body 3px clear of it.
 * N/S: the opening is the two-tile doorway (64px deep), so 42 = 32 + 10 puts
 * the 10px-tall body 5px clear of it.
 */
const SIDE_OFFSET = 44;
const NS_OFFSET = 42;

/**
 * Canonical doorway from a door as the engine places it (doors.js
 * calculateDoorPositionsForRoom: the door sprite's centre and the side of the
 * room it is on). The two rooms' doors on one opening give the same doorway.
 *
 * - E/W: the opening spans the wall column of both rooms; its centre line is
 *   the door's y, and it crosses the boundary between the rooms at
 *   x = door.x ± 16.
 * - N/S: the rooms overlap by the two-tile doorway; the door sprite's centre
 *   (x, y) is the middle of the opening on both sides.
 */
export function canonicalDoorway(door) {
    const { x, y, direction } = door;
    if (direction === 'east') return { axis: 'x', cx: x + 16, cy: y };
    if (direction === 'west') return { axis: 'x', cx: x - 16, cy: y };
    if (direction === 'north' || direction === 'south') return { axis: 'y', cx: x, cy: y };
    return null;
}

export function addDoorway(list, door) {
    const d = canonicalDoorway(door);
    if (!d) return list;
    if (!list.some(o => o.axis === d.axis && Math.abs(o.cx - d.cx) < 2 && Math.abs(o.cy - d.cy) < 2)) {
        list.push(d);
    }
    return list;
}

/**
 * The three pinned points for crossing `doorway` in the direction of travel
 * (sign +1 = towards +x or +y): near side, centre, far side.
 */
export function crossingPoints(doorway, sign) {
    const off = doorway.axis === 'x' ? SIDE_OFFSET : NS_OFFSET;
    const at = (k) => doorway.axis === 'x'
        ? { x: doorway.cx + k, y: doorway.cy, pinned: true }
        : { x: doorway.cx, y: doorway.cy + k, pinned: true };
    return [at(-sign * off), at(0), at(sign * off)];
}

/**
 * The opening's footprint: half its depth along the crossing axis (both wall
 * columns for E/W; the two-tile doorway for N/S, plus the wall strips at its
 * ends), and half its width across, with room for raw grid points that run a
 * cell or two off the centre line.
 */
const FOOT_ALONG = 40;
const FOOT_ACROSS = 24;
function inOpening(p, d) {
    const along = d.axis === 'x' ? Math.abs(p.x - d.cx) : Math.abs(p.y - d.cy);
    const across = d.axis === 'x' ? Math.abs(p.y - d.cy) : Math.abs(p.x - d.cx);
    return along <= FOOT_ALONG && across <= FOOT_ACROSS;
}
function side(p, d) {
    const v = d.axis === 'x' ? p.x - d.cx : p.y - d.cy;
    return v < 0 ? -1 : (v > 0 ? 1 : 0);
}

/**
 * Insert pinned doorway waypoints into a raw grid path (before smoothing).
 * `start` is the feet position.
 *
 * Every run of raw points inside an opening's footprint that is entered on
 * one side and left on the other is a crossing: the run is replaced by the
 * three pins, so the player does not wander about inside the opening on
 * whatever cells the grid search happened to pick. Pins the player is
 * already past are left out (it never walks backwards), and so is the far
 * pin when the destination is inside the opening.
 */
export function insertDoorwayWaypoints(start, path, doorways) {
    if (!path || !path.length || !doorways || !doorways.length) return path;
    let pts = path.slice();
    for (const d of doorways) {
        const out = [];
        const all = [start, ...pts];
        let i = 1;
        while (i < all.length) {
            if (!inOpening(all[i], d) || all[i].pinned) { out.push(all[i]); i++; continue; }
            // A run of raw points inside the opening: all[i..j-1].
            let j = i;
            while (j < all.length && inOpening(all[j], d) && !all[j].pinned) j++;
            const before = all[i - 1];
            const after = j < all.length ? all[j] : null;
            const goalInside = !after;
            const s0 = side(before, d);
            const s1 = after ? side(after, d) : side(all[j - 1], d);
            const sign = s1 > s0 ? 1 : (s1 < s0 ? -1 : 0);
            if (!sign) { for (let k = i; k < j; k++) out.push(all[k]); i = j; continue; }
            const along = d.axis === 'x' ? 'x' : 'y';
            const [near, centre, far] = crossingPoints(d, sign);
            if ((near[along] - start[along]) * sign > 0) out.push(near);
            if ((centre[along] - start[along]) * sign > 0) out.push(centre);
            if (goalInside) {
                out.push(all[j - 1]); // the destination itself, inside the opening
            } else {
                out.push(far);
            }
            i = j;
        }
        pts = out;
    }
    return pts;
}

/** Index of the last pinned waypoint at or after `from`, or -1. */
export function lastPinnedIndex(path, from = 0) {
    for (let i = path.length - 1; i >= from; i--) if (path[i] && path[i].pinned) return i;
    return -1;
}

/** Window (ms) over which a direct (straight-line) player walk must gain ground before it counts as stalled. */
export const DIRECT_WALK_STALL_MS = 180;
/** Walking speed the stall watch compares against (core/constants MOVEMENT_SPEED), px per second. */
export const DIRECT_WALK_SPEED = 150;
/** A walk is stalled when it gained less than this share of what free walking would have gained. */
export const DIRECT_WALK_STALL_SHARE = 1 / 3;

/**
 * One frame of a direct player walk's stall watch (sims tidy R1 m4, R2 m1). The straight walk is
 * chosen once, on line of sight, and line of sight ignores movable bodies: a wheeled chair turns solid
 * when its sitter mounts, so the walk can meet it later (game 5793, Amara's chair). `st` is per walk
 * ({ replanned }, plus the (time, distance) history it keeps in `hist`). The window is time, not
 * frames: physics steps are fixed at 60 a second, so the ground gained per render frame falls as the
 * refresh rate rises, and a free walk at 360 Hz gains well under a pixel a frame. A stall is a real
 * one: over the last `windowMs` the distance to the target fell by less than `share` of
 * `speed * elapsed`. Being blocked on one axis while sliding along a wall towards the target gains
 * ground, so it is not a stall.
 * Returns:
 *  'ok'     moving freely;
 *  'wait'   blocked but not (yet) stalled: keep pushing (a slide along a wall goes on);
 *  'replan' stalled: route through the grid, once per walk;
 *  'stop'   blocked after the replan was used (the old stop on contact).
 */
export function directWalkStall(st, { blocked, dist, now }, { windowMs = DIRECT_WALK_STALL_MS, speed = DIRECT_WALK_SPEED, share = DIRECT_WALK_STALL_SHARE } = {}) {
    const h = st.hist || (st.hist = []);
    h.push({ t: now, d: dist });
    // keep one sample at or before the window start, drop the rest
    while (h.length > 1 && h[1].t <= now - windowMs) h.shift();
    if (st.replanned) return blocked ? 'stop' : 'ok';
    const elapsed = now - h[0].t;
    if (elapsed >= windowMs && h[0].d - dist < share * speed * elapsed / 1000) { st.replanned = true; return 'replan'; }
    return blocked ? 'wait' : 'ok';
}
