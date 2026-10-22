/**
 * NPC SIGHT OCCLUSION
 * ===================
 *
 * Walls, closed doors and tall props block an NPC's view (npc-los.js asks
 * window.npcSightOcclusion before it says an NPC can see the player, and clips
 * the drawn cone with it).
 *
 * Each loaded room gets an occupancy grid of SIGHT_CELL px cells at floor
 * level: wall tiles, closed door sprites and the footprints of sight-blocking
 * props. A sight line is tested from the NPC's feet to the target's feet with
 * a grid walk (Amanatides-Woo), against every room grid the line crosses. The
 * cells holding the two end points are ignored, so standing snug against a rack
 * doesn't hide you from a guard on your own side of it, and someone standing
 * inside a prop's footprint (NPCs walk through the collision rectangles of
 * Tiled props) isn't hidden by that prop.
 *
 * Grids are cached per room and rebuilt when something that blocks changes: a
 * prop moved (pushables), a door opened, a wall tile removed. That check runs
 * at most every VALIDATE_MS per room.
 *
 * Which props block:
 *   - a scenario object with "blocksSight": true always does; "blocksSight":
 *     false never does;
 *   - otherwise a floor-standing prop (not on the back wall) whose sprite key
 *     matches SIGHT_BLOCKING_PROP_PATTERN and is at least
 *     SIGHT_BLOCKING_MIN_HEIGHT px tall: racks, shelving, bookcases, vending
 *     machines, lockers, filing and other tall cabinets, inverters, chillers.
 * A prop's footprint is its full sprite width, from the top of the collision
 * box under it (its own body or an overlapping room collision rectangle) to the
 * sprite's bottom edge; with no collision, the bottom quarter of the sprite.
 *
 * An NPC whose los config has "occlusion": false sees through everything (old
 * behaviour).
 */

export const SIGHT_CELL = 8;
export const SIGHT_BLOCKING_MIN_HEIGHT = 50;
export const SIGHT_BLOCKING_PROP_PATTERN = /rack|shel(f|ves)|bookcase|vending|locker|filing|cabinet|inverter|chiller/;
const VALIDATE_MS = 250;
const TILE = 32;
const VISUAL_TOP = 2;   // back wall rows (constants.js VISUAL_TOP_TILES; no import, tests load this file alone)

const CELL_WALL = 1;
const CELL_DOOR = 2;
const CELL_PROP = 3;

// ---------------------------------------------------------------------------
// Grid primitives (pure; tested directly)
// ---------------------------------------------------------------------------

export function createGrid(x0, y0, width, height, cell = SIGHT_CELL) {
    const cols = Math.max(1, Math.ceil(width / cell));
    const rows = Math.max(1, Math.ceil(height / cell));
    return { x0, y0, cols, rows, cell, cells: new Uint8Array(cols * rows) };
}

/** Mark every cell whose centre lies inside the rect (world px). */
export function markRect(grid, rect, value = CELL_PROP) {
    if (!rect || !(rect.w > 0) || !(rect.h > 0)) return 0;
    const { x0, y0, cols, rows, cell } = grid;
    const cx0 = Math.max(0, Math.ceil((rect.x - x0) / cell - 0.5));
    const cx1 = Math.min(cols - 1, Math.floor((rect.x + rect.w - x0) / cell - 0.5));
    const cy0 = Math.max(0, Math.ceil((rect.y - y0) / cell - 0.5));
    const cy1 = Math.min(rows - 1, Math.floor((rect.y + rect.h - y0) / cell - 0.5));
    let n = 0;
    for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
            grid.cells[cy * cols + cx] = value;
            n++;
        }
    }
    return n;
}

/** Mark whole cells covering a rect (walls: a full tile is solid). */
function markRectFull(grid, rect, value) {
    const { x0, y0, cols, rows, cell } = grid;
    const cx0 = Math.max(0, Math.floor((rect.x - x0) / cell));
    const cx1 = Math.min(cols - 1, Math.ceil((rect.x + rect.w - x0) / cell) - 1);
    const cy0 = Math.max(0, Math.floor((rect.y - y0) / cell));
    const cy1 = Math.min(rows - 1, Math.ceil((rect.y + rect.h - y0) / cell) - 1);
    for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) grid.cells[cy * cols + cx] = value;
    }
}

function cellIndexAt(grid, x, y) {
    const cx = Math.floor((x - grid.x0) / grid.cell);
    const cy = Math.floor((y - grid.y0) / grid.cell);
    if (cx < 0 || cy < 0 || cx >= grid.cols || cy >= grid.rows) return -1;
    return cy * grid.cols + cx;
}

/**
 * Walk the segment (x1,y1)->(x2,y2) through the grid. Returns the parametric t
 * (0..1 along the segment) where it first enters a blocked cell, or null. The
 * cells holding the start point and (when ignoreEnd) the end point don't count,
 * and when an end point stands in a prop footprint, the run of prop cells next
 * to it doesn't count either.
 */
export function firstBlockedT(grid, x1, y1, x2, y2, ignoreEnd = true) {
    const dx = x2 - x1, dy = y2 - y1;
    const gx0 = grid.x0, gy0 = grid.y0;
    const gx1 = gx0 + grid.cols * grid.cell, gy1 = gy0 + grid.rows * grid.cell;
    // Liang-Barsky clip to the grid box
    let t0 = 0, t1 = 1;
    const p = [-dx, dx, -dy, dy];
    const q = [x1 - gx0, gx1 - x1, y1 - gy0, gy1 - y1];
    for (let i = 0; i < 4; i++) {
        if (p[i] === 0) {
            if (q[i] < 0) return null;
        } else {
            const r = q[i] / p[i];
            if (p[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
            else { if (r < t0) return null; if (r < t1) t1 = r; }
        }
    }
    if (t0 > t1) return null;

    const c = grid.cell;
    const startIdx = cellIndexAt(grid, x1, y1);
    const endIdx = ignoreEnd ? cellIndexAt(grid, x2, y2) : -1;
    const sx = x1 + dx * t0, sy = y1 + dy * t0;
    let cx = Math.min(grid.cols - 1, Math.max(0, Math.floor((sx - gx0) / c)));
    let cy = Math.min(grid.rows - 1, Math.max(0, Math.floor((sy - gy0) / c)));
    const stepX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
    const stepY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
    let tMaxX = stepX !== 0 ? ((gx0 + (cx + (stepX > 0 ? 1 : 0)) * c) - x1) / dx : Infinity;
    let tMaxY = stepY !== 0 ? ((gy0 + (cy + (stepY > 0 ? 1 : 0)) * c) - y1) / dy : Infinity;
    const tDeltaX = stepX !== 0 ? c / Math.abs(dx) : Infinity;
    const tDeltaY = stepY !== 0 ? c / Math.abs(dy) : Infinity;
    let tEntry = t0;
    const epsT = 1 / Math.max(1, Math.hypot(dx, dy));
    const maxSteps = grid.cols + grid.rows + 2;
    if (_walkVals.length < maxSteps + 1) {
        _walkVals = new Uint8Array(maxSteps * 2 + 2);
        _walkTs = new Float64Array(maxSteps * 2 + 2);
    }
    let n = 0;
    for (let s = 0; s <= maxSteps; s++) {
        const idx = cy * grid.cols + cx;
        // A cell entered within 1 px of an end point counts as that end's own cell
        // (an end point exactly on a cell edge touches two cells)
        const atStart = idx === startIdx || (t0 === 0 && tEntry <= epsT);
        _walkVals[n] = (atStart || idx === endIdx) ? 0 : grid.cells[idx];
        _walkTs[n] = tEntry;
        n++;
        if (tMaxX < tMaxY) {
            if (tMaxX > t1) break;
            tEntry = tMaxX; tMaxX += tDeltaX; cx += stepX;
        } else {
            if (tMaxY > t1) break;
            tEntry = tMaxY; tMaxY += tDeltaY; cy += stepY;
        }
        if (cx < 0 || cy < 0 || cx >= grid.cols || cy >= grid.rows) break;
    }
    // Someone standing in a prop's footprint (NPCs walk through props' collision
    // rectangles, and footprints are estimates) isn't hidden by that same prop:
    // drop a run of prop cells next to either end point.
    let i = 0, j = n - 1;
    if (t0 === 0 && startIdx !== -1 && grid.cells[startIdx] === CELL_PROP) {
        i = 1;
        while (i < n && _walkVals[i] === CELL_PROP) i++;
    }
    if (t1 === 1 && endIdx !== -1 && grid.cells[endIdx] === CELL_PROP) {
        j = n - 2;
        while (j >= i && _walkVals[j] === CELL_PROP) j--;
    }
    for (let k = i; k <= j; k++) if (_walkVals[k] !== 0) return _walkTs[k];
    return null;
}

let _walkVals = new Uint8Array(0);
let _walkTs = new Float64Array(0);

function gridTouchesBox(grid, minX, minY, maxX, maxY) {
    return !(maxX < grid.x0 || maxY < grid.y0 ||
        minX > grid.x0 + grid.cols * grid.cell || minY > grid.y0 + grid.rows * grid.cell);
}

/** True when nothing blocks the segment in any of the grids. */
export function segmentClear(grids, x1, y1, x2, y2) {
    const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
    for (const g of grids) {
        if (!g || !gridTouchesBox(g, minX, minY, maxX, maxY)) continue;
        if (firstBlockedT(g, x1, y1, x2, y2, true) !== null) return false;
    }
    return true;
}

/** Distance along a ray (angle in radians) to the first blocked cell, at most range. */
export function rayDistance(grids, x, y, angle, range) {
    const x2 = x + Math.cos(angle) * range, y2 = y + Math.sin(angle) * range;
    const minX = Math.min(x, x2), maxX = Math.max(x, x2);
    const minY = Math.min(y, y2), maxY = Math.max(y, y2);
    let best = 1;
    for (const g of grids) {
        if (!g || !gridTouchesBox(g, minX, minY, maxX, maxY)) continue;
        const t = firstBlockedT(g, x, y, x2, y2, false);
        if (t !== null && t < best) best = t;
    }
    return best * range;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

function spriteRect(s) {
    const w = s.displayWidth ?? s.width ?? 0;
    const h = s.displayHeight ?? s.height ?? 0;
    const ox = s.originX ?? 0, oy = s.originY ?? 0;
    return { x: s.x - ox * w, y: s.y - oy * h, w, h };
}

/** Sprite key without frame digits or extension: "batrack3" -> "batrack". */
export function propBaseKey(sprite) {
    const key = sprite?.texture?.key ?? sprite?.textureKey ?? sprite?.key ?? '';
    return String(key).replace(/\.png$/i, '').replace(/\d+$/, '');
}

/** Does this room object block sight? See the header for the rules. */
export function propBlocksSight(sprite) {
    if (!sprite || sprite.active === false || sprite.destroyed) return false;
    const flag = sprite.blocksSight ?? sprite.scenarioData?.blocksSight;
    if (flag === true) return true;
    if (flag === false) return false;
    if (sprite.elevation > 0) return false;           // hung on the back wall
    if (sprite.hasWheels) return false;               // chairs and carts roll about
    const key = propBaseKey(sprite);
    if (!key || !SIGHT_BLOCKING_PROP_PATTERN.test(key)) return false;
    return spriteRect(sprite).h >= SIGHT_BLOCKING_MIN_HEIGHT;
}

function bodyRect(b) {
    if (!b || b.enable === false) return null;
    const w = b.width ?? 0, h = b.height ?? 0;
    if (!(w > 0) || !(h > 0)) return null;
    const x = b.x ?? b.position?.x, y = b.y ?? b.position?.y;
    if (x === undefined || y === undefined) return null;
    return { x, y, w, h };
}

function rectOfCollisionBody(r) {
    if (!r) return null;
    if (r.body) {
        const br = bodyRect(r.body);
        if (br) return br;
    }
    const w = r.width ?? 0, h = r.height ?? 0;
    if (!(w > 0) || !(h > 0)) return null;
    const ox = r.originX ?? 0.5, oy = r.originY ?? 0.5;
    return { x: r.x - ox * w, y: r.y - oy * h, w, h };
}

/**
 * Floor footprint of a sight-blocking prop (world px). collisionRects: the
 * room's free collision rectangles, already as {x,y,w,h}.
 */
export function propFootprint(sprite, collisionRects = []) {
    const sr = spriteRect(sprite);
    if (!(sr.w > 0) || !(sr.h > 0)) return null;
    const bottom = sr.y + sr.h;
    let top = Infinity;
    const own = bodyRect(sprite.body);
    if (own) top = Math.min(top, own.y);
    const lowerHalf = sr.y + sr.h * 0.4;
    for (const r of collisionRects) {
        if (!r) continue;
        const overlapX = Math.min(r.x + r.w, sr.x + sr.w) - Math.max(r.x, sr.x);
        if (overlapX < 4) continue;
        if (r.y > bottom || r.y + r.h < lowerHalf) continue;
        top = Math.min(top, r.y);
    }
    if (!Number.isFinite(top)) top = bottom - Math.max(10, sr.h * 0.25);
    top = Math.max(top, sr.y);
    if (bottom - top < 6) top = bottom - 6;
    return { x: sr.x, y: top, w: sr.w, h: bottom - top };
}

// ---------------------------------------------------------------------------
// Room grids
// ---------------------------------------------------------------------------

function wallTiles(layer, cols, rows) {
    const out = [];
    const data = layer?.layer?.data;
    for (let ty = 0; ty < rows; ty++) {
        for (let tx = 0; tx < cols; tx++) {
            let t;
            if (data) t = data[ty]?.[tx];
            else if (typeof layer?.getTileAt === 'function') t = layer.getTileAt(tx, ty);
            if (t && t.index !== -1 && t.index !== undefined && t.index !== null) out.push(tx, ty);
        }
    }
    return out;
}

function roomExtent(room) {
    const pos = room?.position;
    const map = room?.map;
    if (!pos || !map) return null;
    const cols = map.width ?? Math.round((map.widthInPixels ?? 0) / TILE);
    const rows = map.height ?? Math.round((map.heightInPixels ?? 0) / TILE);
    const tw = map.tileWidth ?? TILE, th = map.tileHeight ?? TILE;
    if (!(cols > 0) || !(rows > 0)) return null;
    return { x: pos.x, y: pos.y, cols, rows, tw, th };
}

function doorBlocks(d) {
    if (!d || d.active === false || d.destroyed) return false;
    if (d.body && d.body.enable === false) return false;
    if (d.isOpen === true || d.doorProperties?.open === true) return false;
    return true;
}

function blockingProps(room) {
    const out = [];
    for (const s of Object.values(room?.objects || {})) {
        if (propBlocksSight(s)) out.push(s);
    }
    return out;
}

function roomSignature(room, ext, props) {
    let wallCount = 0;
    for (const l of room.wallsLayers || []) wallCount += wallTiles(l, ext.cols, ext.rows).length;
    // Door body position too: a new body sits at 0,0 until its first physics step
    const doors = (room.doorSprites || []).map(d => (doorBlocks(d)
        ? `${Math.round(d.body?.x ?? d.x)},${Math.round(d.body?.y ?? d.y)}` : '0')).join(';');
    // Body size too: a table's body starts as the whole sprite and is cut down a frame later
    const p = props.map(s => `${Math.round(s.x)},${Math.round(s.y)},${Math.round(s.body?.x ?? 0)},${Math.round(s.body?.y ?? 0)},${Math.round(s.body?.height ?? 0)}`).join(';');
    const c = (room.collisionBodies || []).length;
    return `${ext.x},${ext.y}|${wallCount}|${doors}|${c}|${p}`;
}

/**
 * Build a room's sight grid from its loaded state (window.rooms[id]).
 * thinBackWall (default): mark the back wall rows (the top VISUAL_TOP rows) by
 * their bottom 8px only, like the south row. Rooms stack with those two rows
 * overlapping the room to the north, whose occupants walk over that wall face;
 * a full-tile back wall hid someone standing at the foot of the north room from
 * a person in that same room. Seen from inside the room nothing changes: a ray
 * going north still stops at the wall's foot.
 */
export function buildRoomSightGrid(room, props = blockingProps(room), { thinBackWall = true } = {}) {
    const ext = roomExtent(room);
    if (!ext) return null;
    const grid = createGrid(ext.x, ext.y, ext.cols * ext.tw, ext.rows * ext.th);
    for (const layer of room.wallsLayers || []) {
        const tiles = wallTiles(layer, ext.cols, ext.rows);
        for (let i = 0; i < tiles.length; i += 2) {
            const tx = tiles[i], ty = tiles[i + 1];
            // The south wall row is walkable floor in the 3/4 view: its collision box
            // (collision.js) sits on the tile's bottom edge, so only that edge blocks.
            const inner = tx > 0 && tx < ext.cols - 1;
            const southRow = ty === ext.rows - 1 && inner;
            const backRow = thinBackWall && ty < VISUAL_TOP && inner;   // see the doc comment
            const h = (southRow || backRow) ? 8 : ext.th;
            markRectFull(grid, { x: ext.x + tx * ext.tw, y: ext.y + (ty + 1) * ext.th - h, w: ext.tw, h }, CELL_WALL);
        }
    }
    for (const d of room.doorSprites || []) {
        if (!doorBlocks(d)) continue;
        const r = bodyRect(d.body) || spriteRect(d);
        markRectFull(grid, r, CELL_DOOR);
    }
    const collisionRects = (room.collisionBodies || []).map(rectOfCollisionBody).filter(Boolean);
    for (const s of props) markRect(grid, propFootprint(s, collisionRects), CELL_PROP);
    return grid;
}

// ---------------------------------------------------------------------------
// Ground points
// ---------------------------------------------------------------------------

function centreOf(s) {
    if (!s) return null;
    if (typeof s.getCenter === 'function') return s.getCenter();
    if (s.x !== undefined && s.y !== undefined) return { x: s.x, y: s.y };
    return null;
}

/** An NPC's feet (physics body centre), or its sprite/raw position. */
export function npcGroundPoint(npc) {
    const s = npc?._sprite || npc?.sprite;
    const bc = s?.body?.center;
    if (bc && Number.isFinite(bc.x) && Number.isFinite(bc.y)) return { x: bc.x, y: bc.y };
    const c = centreOf(s);
    if (c) return { x: c.x, y: c.y };
    if (npc?.x !== undefined && npc?.y !== undefined) return { x: npc.x, y: npc.y };
    if (npc?.position?.x !== undefined) return { x: npc.position.x, y: npc.position.y };
    return null;
}

/**
 * A target's feet. An entity with a body gives its body centre. A bare point is
 * taken as the player's sprite centre (what every caller passes) and moved down
 * by the player's own centre-to-feet offset.
 */
export function targetGroundPoint(target) {
    if (!target) return null;
    const bc = target.body?.center;
    if (bc && Number.isFinite(bc.x)) return { x: bc.x, y: bc.y };
    const c = centreOf(target);
    if (!c) return null;
    const pl = typeof window !== 'undefined' ? window.player : null;
    const pbc = pl?.body?.center;
    const pc = pl && typeof pl.getCenter === 'function' ? pl.getCenter() : null;
    if (pbc && pc && Number.isFinite(pbc.y) && Number.isFinite(pc.y)) {
        return { x: c.x + (pbc.x - pc.x), y: c.y + (pbc.y - pc.y) };
    }
    return { x: c.x, y: c.y };
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

export class SightOcclusion {
    constructor() {
        this._cache = new Map();   // roomId -> { grid, sig, checkedAt, room }
        this._wallCache = new Map(); // same, walls-only grids (isWallClearBetween)
        this.builds = 0;           // grids built (tests, perf checks)
    }

    reset() { this._cache.clear(); this._wallCache.clear(); }

    invalidate(roomId) {
        if (roomId === undefined) { this._cache.clear(); this._wallCache.clear(); }
        else { this._cache.delete(roomId); this._wallCache.delete(roomId); }
    }

    _rooms() {
        return (typeof window !== 'undefined' && window.rooms) || {};
    }

    /**
     * The cached grid of one room, rebuilt if anything blocking changed.
     * wallsOnly: walls and closed doors, no props (interaction reach, and NPCs
     * without an los block turning to face the player).
     */
    gridFor(roomId, now = Date.now(), wallsOnly = false) {
        const cache = wallsOnly ? this._wallCache : this._cache;
        const room = this._rooms()[roomId];
        if (!room) { cache.delete(roomId); return null; }
        let entry = cache.get(roomId);
        if (entry && entry.room === room && now - entry.checkedAt < VALIDATE_MS) return entry.grid;
        const ext = roomExtent(room);
        if (!ext) return null;
        const props = wallsOnly ? [] : blockingProps(room);
        const sig = roomSignature(room, ext, props);
        if (entry && entry.room === room && entry.sig === sig) {
            entry.checkedAt = now;
            return entry.grid;
        }
        const grid = buildRoomSightGrid(room, props);
        this.builds++;
        entry = { grid, sig, checkedAt: now, room };
        cache.set(roomId, entry);
        return grid;
    }

    /** Grids of every loaded room touching the box. */
    gridsNear(minX, minY, maxX, maxY, now = Date.now(), wallsOnly = false) {
        const out = [];
        for (const [id, room] of Object.entries(this._rooms())) {
            const ext = roomExtent(room);
            if (!ext) continue;
            if (maxX < ext.x || maxY < ext.y || minX > ext.x + ext.cols * ext.tw || minY > ext.y + ext.rows * ext.th) continue;
            const g = this.gridFor(id, now, wallsOnly);
            if (g) out.push(g);
        }
        return out;
    }

    /** True when nothing blocks the line between two floor points. */
    isClearBetween(a, b) {
        if (!a || !b) return true;
        const grids = this.gridsNear(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y));
        return segmentClear(grids, a.x, a.y, b.x, b.y);
    }

    /** True when no wall or closed door lies between two floor points (props ignored). */
    isWallClearBetween(a, b) {
        if (!a || !b) return true;
        const grids = this.gridsNear(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y), Date.now(), true);
        return segmentClear(grids, a.x, a.y, b.x, b.y);
    }

    /** True when the NPC's view of the target (feet to feet) is not blocked. */
    isSightClear(npc, target) {
        return this.isClearBetween(npcGroundPoint(npc), targetGroundPoint(target));
    }

    /** Clipped ray lengths for a fan of angles (radians) from a floor point. */
    clipFan(origin, angles, range) {
        const grids = this.gridsNear(origin.x - range, origin.y - range, origin.x + range, origin.y + range);
        const out = new Array(angles.length);
        for (let i = 0; i < angles.length; i++) out[i] = rayDistance(grids, origin.x, origin.y, angles[i], range);
        return out;
    }

    /** Debug: shade every blocked cell of the loaded rooms (window.npcSightOcclusion.debugDraw(scene)). */
    debugDraw(scene) {
        if (this._debugGfx) { this._debugGfx.destroy(); this._debugGfx = null; }
        if (!scene?.add) return null;
        const g = scene.add.graphics();
        const colours = { [CELL_WALL]: 0x3366ff, [CELL_DOOR]: 0xffaa00, [CELL_PROP]: 0xff3355 };
        for (const id of Object.keys(this._rooms())) {
            const grid = this.gridFor(id);
            if (!grid) continue;
            for (let i = 0; i < grid.cells.length; i++) {
                const v = grid.cells[i];
                if (!v) continue;
                g.fillStyle(colours[v] ?? 0xffffff, 0.45);
                g.fillRect(grid.x0 + (i % grid.cols) * grid.cell, grid.y0 + Math.floor(i / grid.cols) * grid.cell, grid.cell, grid.cell);
            }
        }
        g.setDepth(100000);
        this._debugGfx = g;
        return g;
    }
}

export const sightOcclusion = new SightOcclusion();

if (typeof window !== 'undefined') {
    window.npcSightOcclusion = sightOcclusion;
}
