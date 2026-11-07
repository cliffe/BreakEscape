/**
 * A dropped magnet (a droppable item with affordance.magnet, npc-needs.js) put down
 * beside a table lands on the table top instead of the floor (office life slice 23,
 * OFFICE_LIFE_PLAN.md 12.13).
 *
 * Pure and deterministic: callers hand in plain rectangles. item-drop.js gathers the
 * room's tables and objects; npc-needs.js reaches edgeCell() through window.tableDrop
 * (it keeps no static imports). No imports here, so node tests load it on its own.
 *
 * A table is { id, x, y, w, h, depth, front? }: its sprite's top-left, size, depth
 * and, when table_surfaces.json has one, the first sprite row of its front face.
 */

export const TABLE_SNAP_RANGE = 32;     // one tile from the table's drawn rectangle
export const TABLE_INSET = 2;           // keep the item inside the top's ends
export const TABLE_BASE_FRACTION = 0.4; // base row without surface data (desk1, smalldesk1, hospital_desk1)
export const TABLE_DEPTH_STEP = 0.05;   // over the table and its group items (+0.01 each)
const SLIDE_STEP = 4;
const EDGE_CLEAR = 4;

/** Room-pixel rectangle of a sprite, from its origin and display size. */
export function spriteRect(sp) {
    const w = sp.displayWidth ?? sp.width ?? 0;
    const h = sp.displayHeight ?? sp.height ?? 0;
    const x = sp.x - (sp.originX ?? 0.5) * w;
    const y = sp.y - (sp.originY ?? 0.5) * h;
    return { x, y, w, h };
}

/** The y (room px) an item's base stands on, on this table. */
export function baseY(t) {
    const front = Number(t.front);
    const row = Number.isFinite(front) && front > 2 ? front - 2 : Math.round(t.h * TABLE_BASE_FRACTION);
    return t.y + row;
}

const distToRect = (p, r) => {
    const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
    const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
    return Math.hypot(dx, dy);
};
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (p, r, pad = 0) => p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;

/** The top rectangle of a table: its sprite top down to the base row, full width. */
export function topRect(t) {
    return { x: t.x, y: t.y, w: t.w, h: Math.max(1, baseY(t) - t.y) };
}

/**
 * Where an item of size { w, h } dropped with the player's feet at `feet` lands on a
 * table, or null (the floor). Tables within TABLE_SNAP_RANGE of their drawn rectangle
 * (the player cannot stand nearer the top than its front face and legs) are tried
 * nearest first (ties by id); on each, the feet x clamped into the top, then the
 * nearest clear x in SLIDE_STEP steps (never overlapping a rectangle in `obstacles`).
 * `usable(table)`, when given, skips a table nobody could stand at (no edgeCell): in a
 * block of touching tables the inner ones have no free edge.
 * Returns { tableId, left, top, x, y, depth, elevation } with integer left/top, the
 * centre x/y and the depth (table depth + TABLE_DEPTH_STEP) as an elevation over the
 * item's own bottom + 0.5, the reload formula (rooms.js setDepthAndStore).
 */
export function snapToTable(feet, tables, item, obstacles = [], usable = null) {
    if (!feet || !Array.isArray(tables) || !item || !(item.w > 0) || !(item.h > 0)) return null;
    const near = tables
        .map(t => ({ t, d: distToRect(feet, t) }))
        .filter(e => e.d <= TABLE_SNAP_RANGE)
        .sort((a, b) => a.d - b.d || String(a.t.id).localeCompare(String(b.t.id)));
    for (const { t } of near) {
        const lo = Math.ceil(t.x + TABLE_INSET);
        const hi = Math.floor(t.x + t.w - TABLE_INSET - item.w);
        if (hi < lo) continue;
        if (typeof usable === 'function' && !usable(t)) continue;
        const top = Math.round(baseY(t) - item.h);
        const want = Math.min(hi, Math.max(lo, Math.round(feet.x - item.w / 2)));
        const clear = left => !obstacles.some(o => overlaps({ x: left, y: top, w: item.w, h: item.h }, o));
        let left = null;
        for (let k = 0; left === null && (want - k * SLIDE_STEP >= lo || want + k * SLIDE_STEP <= hi); k++) {
            for (const c of k === 0 ? [want] : [want - k * SLIDE_STEP, want + k * SLIDE_STEP]) {
                if (c >= lo && c <= hi && clear(c)) { left = c; break; }
            }
        }
        if (left === null) continue;
        const depth = t.depth + TABLE_DEPTH_STEP;
        const elevation = Math.round((depth - (top + item.h + 0.5)) * 1000) / 1000;
        return { tableId: t.id, left, top, x: left + item.w / 2, y: top + item.h / 2, depth, elevation };
    }
    return null;
}

/** The table an item rectangle stands on (its base point inside the table's top), or null. */
export function tableUnder(rect, tables) {
    if (!rect || !Array.isArray(tables)) return null;
    const base = { x: rect.x + rect.w / 2, y: rect.y + rect.h - 1 };
    const on = tables
        .filter(t => inside(base, topRect(t), 1))
        .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return on[0] || null;
}

/**
 * Where an NPC stands to use an item on table `t`: just in front of the table under the
 * item, else the nearer of its left and right ends; each snapped by
 * `nearestWalkable(x, y, radiusCells)` and dropped when it lies inside, or within
 * EDGE_CLEAR px of, any table (tables that touch leave only gaps). Never behind: the
 * strip behind a table is often closed in (a sofa, the back wall), and the walkable grid
 * cannot tell. Null when none.
 */
export function edgeCell(centre, t, tables, nearestWalkable) {
    if (!centre || !t || typeof nearestWalkable !== 'function') return null;
    const all = Array.isArray(tables) && tables.length ? tables : [t];
    const cx = Math.min(t.x + t.w - 8, Math.max(t.x + 8, centre.x));
    const ok = c => c && !all.some(o => inside(c, o, EDGE_CLEAR));
    const front = nearestWalkable(cx, t.y + t.h + 10, 2);
    if (ok(front)) return { x: front.x, y: front.y };
    const others = [
        nearestWalkable(t.x - 10, t.y + t.h - 6, 2),
        nearestWalkable(t.x + t.w + 10, t.y + t.h - 6, 2)
    ].filter(ok);
    others.sort((a, b) => Math.hypot(a.x - centre.x, a.y - centre.y) - Math.hypot(b.x - centre.x, b.y - centre.y));
    return others[0] ? { x: others[0].x, y: others[0].y } : null;
}

/**
 * The room-relative tile position a drop is saved with: the sprite's top-left (rooms.js
 * places a reloaded object by its top-left, origin 0), plus the elevation when it stands
 * on a table. Saving the centre made every reloaded drop come back half its size
 * south-east (slice 18b-i's ~13 px).
 */
export function savedPosition(left, top, roomPos, elevation) {
    const pos = { x: (left - roomPos.x) / 32, y: (top - roomPos.y) / 32 };
    if (Number.isFinite(elevation) && elevation !== 0) pos.elevation = elevation;
    return pos;
}

/**
 * The depth rooms.js setDepthAndStore gives an object with this top, height and
 * elevation (a raised object also gets the back-wall tie-break, at most 0.32). The drop
 * uses it too, so a reload draws the item exactly as it was.
 */
export function placedDepth(top, h, elevation, roomTop) {
    const bottom = top + h;
    const e = Number.isFinite(elevation) ? elevation : 0;
    return bottom + 0.5 + e + (e > 0 ? (bottom - roomTop) * 0.001 : 0);
}

/** What rooms.js does with a saved position on reload: top-left and depth. */
export function reloadedPlacement(pos, roomPos, item) {
    const left = Math.round(roomPos.x + pos.x * 32);
    const top = Math.round(roomPos.y + pos.y * 32);
    return { left, top, depth: placedDepth(top, item.h, pos.elevation, roomPos.y) };
}
