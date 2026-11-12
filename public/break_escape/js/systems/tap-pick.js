/**
 * TAP PICK
 * ========
 *
 * A tap goes to the thing under the pointer. The scene's pointerdown (game.js) first
 * gathers every interactable in reach near the tap (gatherInteractablesNearClick), which
 * counts a sprite when the tap is inside its bounds or within a tile of its centre (the
 * tap slop, so small items are easy to hit). That slop let an in-reach item beside the
 * tap take it from an out-of-reach object the pointer was actually on: Kim's phone
 * picked up when her stick was tapped (C3 replay U3), an owner seated over her PC
 * opened as a conversation when the PC was tapped from a step away (UX access finding 6).
 *
 * tapPickList() applies the rule: when an out-of-reach interactable object holds the tap
 * in its bounds, in-reach candidates that are only near the tap drop out. Any that are
 * under the tap too (a seated owner drawn over her PC) stay, and the far object joins
 * them in the pick-one menu as "walk there, then use". With none under the tap the list
 * is empty and the object branch walks to the far object.
 *
 * objectStandPoint() is the walk target for an out-of-reach object, and
 * createPendingTapUse() uses the object once the walk ends in reach.
 *
 * No imports, so the node tests load this file on its own; game.js passes the engine pieces.
 */

/**
 * @param {Array<{underTap?:boolean}>} candidates - the in-reach pick list near the tap
 * @param {Array<object>} farUnderTap - out-of-reach interactable objects whose bounds hold the tap
 * @param {function(object): object} toCandidate - a pick-list entry for a far object (walk, then use)
 * @returns {Array} the pick list
 */
export function tapPickList(candidates, farUnderTap, toCandidate) {
    const list = Array.isArray(candidates) ? candidates : [];
    if (!Array.isArray(farUnderTap) || !farUnderTap.length) return list;
    const under = list.filter(c => c && c.underTap);
    if (!under.length) return [];
    return [...under, ...farUnderTap.map(toCandidate)];
}

/**
 * Where to walk so an out-of-reach object ends in reach. Reach is measured from the
 * sprite centre (player.x/y) to obj.x/y, but the walk steers the feet (the body centre,
 * about 31 px lower): aim so the sprite centre ends half a reach from the object, then
 * convert to a feet target. The straight-line aim can fall inside a wall or furniture (a
 * noticeboard high on the back wall), and the pathfinder's snap to the nearest free cell
 * may then leave the player just out of reach (or behind a wall), so stand points round
 * the object are tried and the one that ends in reach with the shortest walk is kept.
 *
 * @param {{x:number,y:number}} obj
 * @param {{x:number,y:number,body?:{center:{x:number,y:number}}}} player
 * @param {object} deps
 * @param {number} deps.range - INTERACTION_RANGE
 * @param {function(number, number, number=): ?{x:number,y:number}} [deps.findCell] - pathfinder's nearest walkable cell
 * @param {function({x:number,y:number}, object): boolean} [deps.wallClear] - no wall between the point and the object
 * @returns {?{x:number,y:number}} a feet target, or null when the player stands on the object
 */
export function objectStandPoint(obj, player, deps) {
    const range = deps.range;
    const wallClear = deps.wallClear || (() => true);
    const dx = obj.x - player.x;
    const dy = obj.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (!(distance > 0)) return null;
    const stopShort = range / 2;
    const centreX = obj.x - (dx / distance) * stopShort;
    const centreY = obj.y - (dy / distance) * stopShort;
    const footDx = player.body ? player.body.center.x - player.x : 0;
    const footDy = player.body ? player.body.center.y - player.y : 0;
    let target = { x: centreX + footDx, y: centreY + footDy };
    const findCell = deps.findCell;
    if (!findCell) return target;
    const reachAfter = (p) => Math.hypot(p.x - footDx - obj.x, p.y - footDy - obj.y);
    const walk = (p) => Math.hypot(p.x - (player.x + footDx), p.y - (player.y + footDy));
    const aimed = findCell(target.x, target.y);
    if (!aimed || reachAfter(aimed) > range - 4 || !wallClear(aimed, obj)) {
        let best = aimed, bestReach = aimed ? reachAfter(aimed) : Infinity, bestWalk = aimed ? walk(aimed) : Infinity;
        for (let a = 0; a < 16; a++) {
            const ang = (a / 16) * Math.PI * 2;
            for (const r of [8, 16, 24]) {
                const c = findCell(obj.x + Math.cos(ang) * r + footDx, obj.y + Math.sin(ang) * r + footDy, 3);
                if (!c) continue;
                const ra = reachAfter(c), wk = walk(c);
                const ok = ra <= range - 4 && wallClear(c, obj);
                const bestOk = bestReach <= range - 4 && wallClear(best, obj);
                if ((ok && (!bestOk || wk < bestWalk)) || (!ok && !bestOk && ra < bestReach)) {
                    best = c; bestReach = ra; bestWalk = wk;
                }
            }
        }
        if (best) target = best;
    }
    return target;
}

export const PENDING_TAP_USE_MS = 10000;
const STOPPED_SHORT_MS = 400;   // not moving this long after the tap, and out of reach: he stopped short

/**
 * An object tapped from out of reach: use it once the walk there ends in reach. Dropped
 * by any new tap (pointerdown clears it), when the walk stops short, after
 * PENDING_TAP_USE_MS, when the object goes (taken, hidden, destroyed, no longer
 * interactable), or when a minigame opens on the way.
 *
 * @param {object} deps
 * @param {function(object): boolean} deps.inReach - isObjectInInteractionRange
 * @param {function(): boolean} deps.isMoving - the player is on a click-to-move path
 * @param {function(object): void} deps.use - face the object and interact with it
 * @param {function(): boolean} [deps.minigameOpen]
 */
export function createPendingTapUse(deps) {
    let pending = null;
    return {
        arm(obj, at = Date.now()) { pending = obj ? { obj, at } : null; },
        clear() { pending = null; },
        get() { return pending; },
        /** Run from the scene's update(). */
        update(now = Date.now()) {
            const p = pending;
            if (!p) return;
            const o = p.obj;
            if (now - p.at > PENDING_TAP_USE_MS || !o || o.destroyed || o.active === false
                || o.visible === false || !o.interactable) { pending = null; return; }
            if (deps.minigameOpen?.()) { pending = null; return; }
            if (deps.isMoving()) return;
            if (deps.inReach(o)) { pending = null; deps.use(o); return; }
            if (now - p.at > STOPPED_SHORT_MS) pending = null;
        }
    };
}
