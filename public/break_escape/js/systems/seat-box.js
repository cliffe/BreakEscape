/**
 * Seat box geometry (docs/achitechture/SEAT_BOX_PLAN.md, slice 1): the blocks a seated
 * driver takes, and the checks the stand-up order (plan 1.3) uses to pick a landing spot.
 * Pure apart from reading the physics world handed in, so every helper is unit-tested with
 * fake bodies (test/js/seat-box.test.mjs). No imports: seating.js imports this module, and
 * the slice 6 NPC half will too.
 *
 * Bodies that count ("solid"): every enabled static body and every enabled immovable
 * dynamic body, the same sources rebuildWorldGrid() marks (npc-pathfinding.js), so desks,
 * wall strips, locked doors and immovable furniture or NPCs all block. Rectangles are
 * { x, y, w, h } in world px, (x, y) the top-left corner.
 */

/** The walking box (the player's feet collider): 18 x 10, feet at its centre. */
export const WALK_BOX = { w: 18, h: 10 };

/**
 * Seated block per seat family, in rotation-frame px: w x h centred on (cx, cy), the
 * castor base. office40 is the office chairs' existing body ({ w 18, h 8, x 11, y 31 },
 * rooms.js STATIC_SWIVEL_PROPS). Every block is at least WALK_BOX.w wide (plan 1.1, block
 * width rule). white32 and exec are left out until plan section 5 measures them; those
 * chairs keep the whole body.
 */
export const SEAT_BLOCKS = {
    office40: { w: 18, h: 8, cx: 20, cy: 35 }
};

const FAMILY_OF = [
    [/^chair-(darkgray-1|grey-1|grey-4)-rotate\d*$/, 'office40']
];

/** Seat family of a swivel chair sprite, from its rotation texture, or null. */
export function seatFamilyOf(chair) {
    const key = chair?.originalTexture || chair?.texture?.key || '';
    for (const [re, family] of FAMILY_OF) if (re.test(key)) return family;
    return null;
}

/** The seated block for a chair's family, or null (no measured block: the whole body). */
export function blockFor(chair) {
    const family = seatFamilyOf(chair);
    return family && SEAT_BLOCKS[family] ? { ...SEAT_BLOCKS[family] } : null;
}

function eachSolid(scene, ignore, fn) {
    const world = scene?.physics?.world;
    if (!world) return;
    const skip = ignore && ignore.length ? new Set(ignore) : null;
    const left = b => !!skip && !!b.gameObject && skip.has(b.gameObject);
    let stop = false;
    world.staticBodies?.iterate?.(b => { if (!stop && b.enable && !left(b) && fn(b) === false) stop = true; });
    if (stop) return;
    world.bodies?.iterate?.(b => { if (!stop && b.enable && b.immovable && !left(b) && fn(b) === false) stop = true; });
}

const overlaps = (l, t, r, b, B) => r > B.left && l < B.right && b > B.top && t < B.bottom;

/** True when the box [l, t, r, b] overlaps no solid body outside `ignore`. */
function boxClearOfBodies(scene, l, t, r, b, ignore) {
    let clear = true;
    eachSolid(scene, ignore, B => { if (overlaps(l, t, r, b, B)) { clear = false; return false; } return true; });
    return clear;
}

/**
 * True when an 18 x 10 walking box with its feet at (x, y) overlaps no solid body outside
 * `ignore` (game objects) and none of the rectangles in `extra` (the chair just left, which
 * is dynamic again once the stand finishes and would be shoved by Arcade).
 */
export function walkBoxClear(scene, x, y, { ignore = [], extra = [] } = {}) {
    const l = x - WALK_BOX.w / 2, r = x + WALK_BOX.w / 2, t = y - WALK_BOX.h / 2, b = y + WALK_BOX.h / 2;
    for (const e of extra) {
        if (e && r > e.x && l < e.x + e.w && b > e.y && t < e.y + e.h) return false;
    }
    return boxClearOfBodies(scene, l, t, r, b, ignore);
}

/**
 * True when the line from `from` to `to` crosses no solid body outside `ignore`: a 2 x 2
 * probe at 1/4, 1/2 and 3/4 of the way, and every 4 px between, so a desk 4 px deep or more
 * is always hit. The ends aren't probed (the start is inside the chair and its sitter).
 */
export function pathClear(scene, from, to, { ignore = [] } = {}) {
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    const n = Math.max(4, Math.ceil(len / 4));
    const ks = new Set([0.25, 0.5, 0.75]);
    for (let i = 1; i < n; i++) ks.add(i / n);
    for (const k of ks) {
        const x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k;
        if (!boxClearOfBodies(scene, x - 1, y - 1, x + 1, y + 1, ignore)) return false;
    }
    return true;
}

/**
 * The chair's body rectangle from the sprite position plus the body's offset and size, the
 * way seating.js bodyFeet() reads them. Never body.left/top: a disabled body isn't updated
 * by Arcade, so while the player sits those are wherever the chair was when they sat down.
 */
export function chairRect(chair) {
    const b = chair?.body;
    if (!b) return null;
    return {
        x: chair.x + (b.offset.x - (chair.displayOriginX || 0)) * (chair.scaleX ?? 1),
        y: chair.y + (b.offset.y - (chair.displayOriginY || 0)) * (chair.scaleY ?? 1),
        w: b.width,
        h: b.height
    };
}

/**
 * The local stand grid (plan 1.3): the full-size world grid built from the live bodies with
 * `exclude` (the chair and its sitter) left out, and the open-door carves applied, by the
 * same builder as rebuildWorldGrid(). Returns { grid, bounds } or null.
 */
export function localStandGrid(pfm, { exclude = [] } = {}) {
    return pfm?.buildWorldGrid ? pfm.buildWorldGrid({ exclude }) : null;
}

const cellCentre = (bounds, cx, cy) => ({ x: bounds.minX + cx * bounds.step + bounds.step / 2,
                                          y: bounds.minY + cy * bounds.step + bounds.step / 2 });

/** Nearest walkable cell of `built` ({ grid, bounds }) within r cells of (x, y), or null. */
export function nearestCell(built, x, y, r) {
    if (!built?.grid || !built?.bounds) return null;
    const { grid, bounds } = built;
    const { minX, minY, cols, rows, step } = bounds;
    const ccx = Math.floor((x - minX) / step), ccy = Math.floor((y - minY) / step);
    if (ccy >= 0 && ccy < rows && ccx >= 0 && ccx < cols && grid[ccy][ccx] === 0) return cellCentre(bounds, ccx, ccy);
    let best = null, bestD = Infinity;
    for (let d = 1; d <= r; d++) {
        for (let dy = -d; dy <= d; dy++) {
            for (let dx = -d; dx <= d; dx++) {
                if (Math.abs(dx) !== d && Math.abs(dy) !== d) continue;
                const cx = ccx + dx, cy = ccy + dy;
                if (cy < 0 || cy >= rows || cx < 0 || cx >= cols || grid[cy][cx] !== 0) continue;
                const c = cellCentre(bounds, cx, cy);
                const dd = (c.x - x) ** 2 + (c.y - y) ** 2;
                if (dd < bestD) { bestD = dd; best = c; }
            }
        }
        if (best) break;
    }
    return best;
}

/**
 * Walkable cells reachable from (x, y)'s cell through walkable cells only (8-connected),
 * within maxCells steps, nearest to (x, y) first. Never steps through a blocked cell, so it
 * can't reach the far side of a desk.
 */
export function floodStandCells(built, x, y, maxCells) {
    if (!built?.grid || !built?.bounds) return [];
    const { grid, bounds } = built;
    const { minX, minY, cols, rows, step } = bounds;
    const sx = Math.floor((x - minX) / step), sy = Math.floor((y - minY) / step);
    const seen = new Set([`${sx},${sy}`]);
    const out = [];
    let frontier = [[sx, sy]];
    for (let d = 0; d < maxCells && frontier.length; d++) {
        const next = [];
        for (const [fx, fy] of frontier) {
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                const nx = fx + dx, ny = fy + dy, k = `${nx},${ny}`;
                if (seen.has(k) || nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                seen.add(k);
                if (grid[ny][nx] !== 0) continue;
                next.push([nx, ny]);
                out.push(cellCentre(bounds, nx, ny));
            }
        }
        frontier = next;
    }
    return out.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
}

/**
 * How far the rectangle `rect` can move along the direction (dx, dy) before it meets a solid
 * body outside `ignore` (a swept box test). 0 when it already overlaps one; `max` when
 * nothing is in the way. Slice 6 uses it for the NPC slide and tuck targets; unused in slice 1.
 */
export function sweepBlock(scene, rect, dx, dy, { ignore = [], max = Infinity } = {}) {
    const len = Math.hypot(dx, dy);
    if (!rect || len === 0) return 0;
    const ux = dx / len, uy = dy / len;
    const l = rect.x, t = rect.y, r = rect.x + rect.w, b = rect.y + rect.h;
    let best = max;
    const axis = (u, lo, hi, Blo, Bhi) => {
        if (u === 0) return (hi > Blo && lo < Bhi) ? [-Infinity, Infinity] : null;
        const a = ((u > 0 ? Blo - hi : Bhi - lo)) / u;
        const z = ((u > 0 ? Bhi - lo : Blo - hi)) / u;
        return [a, z];
    };
    eachSolid(scene, ignore, B => {
        const ax = axis(Math.abs(ux) < 1e-9 ? 0 : ux, l, r, B.left, B.right);
        const ay = axis(Math.abs(uy) < 1e-9 ? 0 : uy, t, b, B.top, B.bottom);
        if (!ax || !ay) return true;
        const enter = Math.max(ax[0], ay[0]), exit = Math.min(ax[1], ay[1]);
        if (enter >= exit || exit <= 0) return true;  // misses, touches only, or behind
        const d = Math.max(0, enter);
        if (d < best) best = d;
        return true;
    });
    return best;
}
