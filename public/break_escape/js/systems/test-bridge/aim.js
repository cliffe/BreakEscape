/**
 * Where interact() clicks: a point inside the target's own hit area that no
 * other interactable claims.
 *
 * Clicking an entity's position is wrong for scenario objects, whose origin is
 * the sprite's top-left corner. That corner sits on the edge of the target and
 * often inside a neighbour: in sis02 the HMI-OPS-01 workstation's corner lies
 * inside the Facility Status Board above it, so the engine took the click as a
 * far tap on the board and walked the player away from the PC.
 *
 * The rules mirror the engine's tap router (core/game.js pointerdown and
 * gatherInteractablesNearClick). Another interactable claims a tap when:
 *  - the tap is inside its bounds (objects, NPCs and doors, at any distance:
 *    findObjectsAtPosition, findNPCAtPosition, findDoorAtPosition, and the
 *    doors' own click zones, which match the door sprite);
 *  - it is in the player's reach and the tap is within TAP_SLOP of its
 *    position (gatherInteractablesNearClick). Swivel props count by bounds
 *    only; a shut door counts within its own, longer reach.
 *
 * Pure: the caller passes plain numbers, so this runs in node tests as is.
 */

export const TAP_SLOP = 32;
// Safety margin round every claim, the same 2 px the bridge's click-trigger
// test uses: the engine maps the click back to the world from the pointer's
// pixel and the camera scroll at its next step, and an NPC can move a little
// between the bridge's mousemove and mousedown.
export const CLICK_MARGIN = 2;
// At most this many sample points per target; a large prop widens the step.
export const MAX_SAMPLES = 2500;

const inside = (b, x, y, m = 0) => !!b && x >= b.left - m && x <= b.right + m && y >= b.top - m && y <= b.bottom + m;

/**
 * Ids of the other interactables that would claim a tap at (x, y), counting
 * `margin` px round each claim.
 * @param {Array<{id, kind, bounds, x, y, inReach, swivel}>} others
 */
export function rivalsAt(x, y, others, margin = CLICK_MARGIN) {
    const out = [];
    for (const o of others || []) {
        if (inside(o.bounds, x, y, margin)) { out.push(o.id); continue; }
        if (o.inReach && !o.swivel && Math.hypot(o.x - x, o.y - y) <= TAP_SLOP + margin) out.push(o.id);
    }
    return out;
}

/**
 * Pick the click point for `target`.
 *
 * @param {{bounds:{left,top,right,bottom}, x:number, y:number}} target
 * @param {Array} others  see rivalsAt
 * @param {object} [opts]
 * @param {(x:number, y:number) => boolean} [opts.onScreen]  points the pointer can reach
 * @param {(x:number, y:number) => boolean} [opts.opaque]    the target's own pixels
 * @param {number} [opts.step]  sampling step in world px (default 2; widened to keep
 *   the count under MAX_SAMPLES)
 * @returns {{x, y, clean:boolean, onPixels:boolean, rivals:string[], sampled:number}|null}
 *   clean: no other interactable claims the point. When no clean point exists,
 *   the point with the fewest rivals (a disambiguation menu is then expected).
 *   null when the target has no bounds.
 */
export function chooseAimPoint(target, others, { onScreen = null, opaque = null, step = 2 } = {}) {
    const b = target && target.bounds;
    if (!b || !(b.right >= b.left) || !(b.bottom >= b.top)) return null;
    const cx = (b.left + b.right) / 2;
    const cy = (b.top + b.bottom) / 2;
    // Stay CLICK_MARGIN inside the target's own edges, for the same reason
    // as the margin round the claims.
    const inset = Math.min(CLICK_MARGIN, (b.right - b.left) / 2, (b.bottom - b.top) / 2);
    const area = Math.max(1, (b.right - b.left + 1) * (b.bottom - b.top + 1));
    step = Math.max(step, Math.sqrt(area / MAX_SAMPLES));
    let best = null;
    let sampled = 0;
    for (let y = b.top + inset; y <= b.bottom - inset + 1e-9; y += step) {
        for (let x = b.left + inset; x <= b.right - inset + 1e-9; x += step) {
            if (onScreen && !onScreen(x, y)) continue;
            sampled++;
            const rivals = rivalsAt(x, y, others);
            const onPixels = opaque ? !!opaque(x, y) : true;
            // Fewest rivals first, then the target's own pixels, then nearest
            // the middle of its bounds (what a person clicks).
            const score = [rivals.length, onPixels ? 0 : 1, Math.hypot(x - cx, y - cy)];
            if (!best || lexLess(score, best.score)) best = { x, y, rivals, onPixels, score };
        }
    }
    if (!best) return null;
    return {
        x: Math.round(best.x * 10) / 10,
        y: Math.round(best.y * 10) / 10,
        clean: best.rivals.length === 0,
        onPixels: best.onPixels,
        rivals: best.rivals,
        sampled
    };
}

function lexLess(a, b) {
    for (let i = 0; i < a.length; i++) {
        if (a[i] < b[i]) return true;
        if (a[i] > b[i]) return false;
    }
    return false;
}
