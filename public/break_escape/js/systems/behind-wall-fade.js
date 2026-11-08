/**
 * Behind-the-wall fade (planning_notes/behind_wall_fade/DESIGN.md).
 *
 * The view fakes depth: a south room S's top two tile rows (its back wall) overlap the bottom two
 * rows of the room to its north, and the player can walk into that strip, "behind" S's wall. While
 * they stand there S's wall and the objects drawn in those rows fade to 50%.
 *
 * This file holds the detection (slice 1): which rooms' back walls the player's body is behind.
 *
 * No imports, so the node tests can load this file on its own.
 */

const TILE = 32;
const BACK_WALL_ROWS = 2;   // utils/constants.js VISUAL_TOP_TILES
const DOOR_HALF_WIDTH = 16; // a door sprite is 32 px wide

export const FADE_ALPHA = 0.5; // the faded k and the full-blend point of the strip light

let doorwayProvider = null;
/** door-gaps.js registers (roomId) => [{ to, direction, x, y }], the provider interaction-walls.js uses. */
export function setFadeDoorways(fn) { doorwayProvider = typeof fn === 'function' ? fn : null; }

/** World rect of a room's back-wall rows, or null if the room has no map or position yet. */
export function backWallStrip(room) {
    const pos = room?.position, map = room?.map;
    if (!pos || !map) return null;
    const w = map.widthInPixels;
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(w)) return null;
    return { left: pos.x, right: pos.x + w, top: pos.y, bottom: pos.y + BACK_WALL_ROWS * TILE };
}

/**
 * Is the doorway `d` (an entry of S's provider list) open? It is unless S's or d.to's doorSprites
 * hold an active sprite for the pair, at that x, that isn't open. That is interaction-walls.js
 * doorClosed with an x match, for rooms joined by more than one door. It covers a door opened
 * from either side (the opener is inactive, the far sprite is gone) and a gate door (sprite
 * active, doorProperties.open toggles).
 */
export function doorwayOpen(rooms, S, d) {
    for (const [id, other] of [[S, d.to], [d.to, S]]) {
        for (const sprite of Object.values(rooms?.[id]?.doorSprites || {})) {
            const props = sprite?.doorProperties;
            if (!props || sprite.active === false || props.open) continue;
            if (props.connectedRoom !== other) continue;
            if (Math.abs((props.worldX ?? NaN) - d.x) <= 1) return false;
        }
    }
    return true;
}

/** The open north doorways of room S, as [{ to, x }]. Empty without a provider. */
export function openNorthDoorways(rooms, S, doorways = doorwayProvider) {
    if (!doorways) return [];
    let list;
    try { list = doorways(S) || []; } catch (e) { return []; }
    return list.filter(d => d && d.direction === 'north' && Number.isFinite(d.x) && doorwayOpen(rooms, S, d));
}

/**
 * Ids of the rooms whose back wall the player's body is behind.
 *   body: { left, right, feetY } with left = player.body.x, right = left + player.body.width,
 *         feetY = player.body.y + player.body.height (the bottom edge updatePlayerRoom uses).
 * S is included when the body's x-range overlaps its strip and strip.top + margin < feetY <
 * strip.bottom (the strip is open at the bottom: feet on S's floor never count). It is dropped
 * while the body is over an open north doorway of S, within 16 + half the body's width of its x.
 * A result with two ids means the body is over the seam of two side-by-side south rooms.
 */
export function roomsBehindWallAt(body, rooms, { margin = 4, doorways = doorwayProvider } = {}) {
    const out = [];
    if (!body || !rooms) return out;
    const { left, right, feetY } = body;
    if (![left, right, feetY].every(Number.isFinite)) return out;
    const cx = (left + right) / 2, half = (right - left) / 2;
    for (const id of Object.keys(rooms)) {
        const strip = backWallStrip(rooms[id]);
        if (!strip) continue;
        if (!(right > strip.left && left < strip.right)) continue;
        if (!(feetY > strip.top + margin && feetY < strip.bottom)) continue;
        let suppressed = false;
        for (const d of openNorthDoorways(rooms, id, doorways)) {
            if (Math.abs(cx - d.x) <= DOOR_HALF_WIDTH + half) { suppressed = true; break; }
        }
        if (!suppressed) out.push(id);
    }
    return out;
}
