/**
 * "Prefer to route around" objects for click-to-move.
 *
 * Some objects can be walked through or pushed (wheeled chairs and trolleys,
 * props with no collision such as a vending machine on the items layer). The
 * player's click-to-move path should go round them when there is a sensible
 * way round, and only go through when there isn't.
 *
 * The world grid keeps these cells walkable. For a player path request their
 * cells get an extra EasyStar point cost (AVOID_CELL_COST per cell instead of
 * 1), so A* takes a detour unless it is longer than the cost of crossing. The
 * direct-line and smoothing shortcuts also refuse a straight line through one,
 * unless the raw route itself goes through it. WASD movement is unaffected.
 *
 * Which objects: scenario `preferAvoid: true|false` wins; otherwise wheeled
 * (pushable) props default to true. Objects with a solid immovable body are
 * already walls on the grid and are skipped.
 */

// Cost of entering one 8px cell of an avoided object (a free cell costs 1).
// Crossing a vending machine's footprint (3 padded cells) costs ~60, so any
// detour up to ~55 cells (~440px, more than a room's width) is taken first.
export const AVOID_CELL_COST = 20;

/** Does this sprite ask click-to-move to route round it? */
export function prefersAvoid(sprite) {
    if (!sprite || sprite.active === false || sprite.visible === false) return false;
    const flag = sprite.scenarioData?.preferAvoid;
    if (typeof flag === 'boolean') return flag;
    return sprite.hasWheels === true;
}

/**
 * Floor footprint of an avoided sprite in world pixels {left, top, right, bottom},
 * or null. A dynamic body gives its own box; a body-less sprite uses the bottom
 * third of its bounds (the same rule as the default chair body). A solid body
 * (static or immovable) returns null: the grid already blocks it.
 */
export function avoidFootprint(sprite) {
    const body = sprite.body;
    if (body && body.enable !== false) {
        if (body.immovable || body.physicsType === 1 /* STATIC_BODY */) return null;
        return { left: body.left, top: body.top, right: body.right, bottom: body.bottom };
    }
    const b = typeof sprite.getBounds === 'function'
        ? sprite.getBounds()
        : { x: sprite.x, y: sprite.y, width: sprite.displayWidth ?? sprite.width, height: sprite.displayHeight ?? sprite.height };
    if (!(b.width > 0 && b.height > 0)) return null;
    const h = b.height / 3;
    return { left: b.x, top: b.y + b.height - h, right: b.x + b.width, bottom: b.y + b.height };
}

/** Footprints of every avoided sprite in `sprites` (any iterable, duplicates ignored). */
export function collectAvoidRects(sprites) {
    const rects = [];
    const seen = new Set();
    for (const s of sprites) {
        if (!s || seen.has(s)) continue;
        seen.add(s);
        if (!prefersAvoid(s)) continue;
        const r = avoidFootprint(s);
        if (r) rects.push(r);
    }
    return rects;
}

/**
 * Grid cells covered by the rects, padded the way rebuildWorldGrid pads solid
 * bodies (one cell either side horizontally, 2px vertically) so a path round
 * the object clears it with the feet collider. Only walkable cells are listed.
 */
export function avoidCells(rects, gridBounds, grid) {
    const { minX, minY, cols, rows, step } = gridBounds;
    const out = [];
    const seen = new Set();
    const padY = 2;
    for (const r of rects) {
        const cx1 = Math.max(0, Math.floor((r.left - minX) / step) - 1);
        const cx2 = Math.min(cols - 1, Math.floor((r.right - minX - 1) / step) + 1);
        const cy1 = Math.max(0, Math.floor((r.top - padY - minY) / step));
        const cy2 = Math.min(rows - 1, Math.floor((r.bottom + padY - minY - 1) / step));
        for (let cy = cy1; cy <= cy2; cy++) {
            for (let cx = cx1; cx <= cx2; cx++) {
                const k = cy * cols + cx;
                if (seen.has(k) || grid[cy]?.[cx] !== 0) continue;
                seen.add(k);
                out.push({ cx, cy });
            }
        }
    }
    return out;
}

function segHitsBox(ax, ay, bx, by, l, t, r, b) {
    // Liang-Barsky clip of segment A->B against the box.
    let t0 = 0, t1 = 1;
    const dx = bx - ax, dy = by - ay;
    const p = [-dx, dx, -dy, dy];
    const q = [ax - l, r - ax, ay - t, b - ay];
    for (let i = 0; i < 4; i++) {
        if (p[i] === 0) { if (q[i] < 0) return false; continue; }
        const u = q[i] / p[i];
        if (p[i] < 0) { if (u > t1) return false; if (u > t0) t0 = u; }
        else { if (u < t0) return false; if (u < t1) t1 = u; }
    }
    return true;
}

const inRect = (x, y, r, m) => x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m;

/**
 * Does a walk from (x1,y1) to (x2,y2) by a body `halfWidth` wide cross an
 * avoided rect? Rects holding either end are ignored (the player is already
 * in it, or is walking up to it), as are rects that hold any point in `via`
 * (the raw route goes through them anyway, so a shortcut across is fine).
 */
export function crossesAvoidRect(x1, y1, x2, y2, rects, { halfWidth = 9, margin = 2, via = null } = {}) {
    if (!rects || rects.length === 0) return false;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const px = len > 0.001 ? -dy / len : 1;
    const py = len > 0.001 ? dx / len : 0;
    const rays = [0, halfWidth, -halfWidth].map(o => [x1 + px * o, y1 + py * o, x2 + px * o, y2 + py * o]);
    for (const r of rects) {
        // 6px: the feet centre of a player pushing a cart sits ~5px off its body.
        if (inRect(x1, y1, r, 6) || inRect(x2, y2, r, 6)) continue;
        // 4px: half a grid cell, so a route cell that skirts the object (its
        // centre 6px+ off the edge, see avoidCells) doesn't count as through it.
        if (via && via.some(p => inRect(p.x, p.y, r, 4))) continue;
        const l = r.left - margin, t = r.top - margin, rt = r.right + margin, b = r.bottom + margin;
        if (rays.some(([ax, ay, bx, by]) => segHitsBox(ax, ay, bx, by, l, t, rt, b))) return true;
    }
    return false;
}
