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
 * Whether the tap lands on an opaque pixel of the sprite's current frame, not only inside its
 * bounds. NPC frames are 80 px boxes with the figure in the middle, so "under the tap" for an
 * NPC means on the figure (code review R1 M1). The world point is turned into frame pixels
 * allowing for origin, scale and flipX (rotation is not used on these sprites). Without a
 * texture test (alphaAt missing, or it answers null: a frame it cannot read) the bounds decide.
 *
 * @param {object} sprite - a Phaser sprite or image (x, y, originX/Y, scaleX/Y, flipX, frame, texture)
 * @param {number} worldX
 * @param {number} worldY
 * @param {function(number, number, string, (string|number)): ?number} [alphaAt] - scene.textures.getPixelAlpha
 * @returns {boolean}
 */
export function opaqueAt(sprite, worldX, worldY, alphaAt) {
    if (!sprite) return false;
    const frame = sprite.frame || {};
    const w = frame.realWidth ?? sprite.width ?? 0;
    const h = frame.realHeight ?? sprite.height ?? 0;
    const sx = Math.abs(sprite.scaleX ?? 1) || 1;
    const sy = Math.abs(sprite.scaleY ?? 1) || 1;
    let lx = (worldX - sprite.x) / sx + (sprite.originX ?? 0.5) * w;
    const ly = (worldY - sprite.y) / sy + (sprite.originY ?? 0.5) * h;
    if (!(lx >= 0 && lx < w && ly >= 0 && ly < h)) return false;
    const key = sprite.texture?.key;
    // No pixel test without one, or for Phaser's stand-in textures: __MISSING draws only a
    // green outline, so its "figure" would be the outline (code review R2 n4)
    if (typeof alphaAt !== 'function' || !key || key === '__MISSING' || key === '__DEFAULT') return true;
    // Phaser mirrors a flipped frame about its centre: local lx shows texel w - lx (R2 n1)
    if (sprite.flipX) lx = Math.min(w - lx, w - 1);
    const fx = Math.floor(lx);
    const fy = Math.floor(ly);
    // A trimmed atlas frame keeps its pixels at frame.x / frame.y inside realWidth; the margin
    // round them is empty. getPixelAlpha takes untrimmed coordinates and subtracts the trim
    // itself, so only the margin test uses it here (code review R2 m2)
    if (frame.cutWidth !== undefined) {
        const cx = fx - (frame.x || 0), cy = fy - (frame.y || 0);
        if (cx < 0 || cy < 0 || cx >= frame.cutWidth || cy >= frame.cutHeight) return false;
    }
    let a = null;
    try { a = alphaAt(fx, fy, key, frame.name); } catch (e) { a = null; }
    if (a === null || a === undefined) return true;
    return a > 0;
}

export const NPC_FIGURE_SLOP_PX = 2;

/**
 * Whether the tap is on an NPC's figure: an opaque pixel at the tap or within
 * NPC_FIGURE_SLOP_PX of it (a 5 x 5 square), so a touch that lands a pixel off her outline
 * still counts as her (code review R2 m5). Objects keep the exact test (opaqueAt).
 */
export function opaqueNear(sprite, worldX, worldY, alphaAt, slop = NPC_FIGURE_SLOP_PX) {
    if (opaqueAt(sprite, worldX, worldY, alphaAt)) return true;
    const sx = Math.abs(sprite?.scaleX ?? 1) || 1;
    const sy = Math.abs(sprite?.scaleY ?? 1) || 1;
    for (let dy = -slop; dy <= slop; dy++) {
        for (let dx = -slop; dx <= slop; dx++) {
            if ((dx || dy) && opaqueAt(sprite, worldX + dx * sx, worldY + dy * sy, alphaAt)) return true;
        }
    }
    return false;
}

/**
 * The out-of-reach things under the tap that take it from in-reach things only near it.
 *
 * @param {object} args
 * @param {Array<object>} args.objectsUnderTap - interactable objects whose bounds hold the tap
 * @param {?object} args.npcUnderTap - the NPC sprite under the tap (findNPCAtPosition), or null
 * @param {object} deps
 * @param {function(object): boolean} deps.inReach
 * @param {function(object): boolean} [deps.isSeat]
 * @param {function(object): boolean} [deps.sameRoom] - in the player's own room (sameRoomFrom the feet)
 * @param {function(object): boolean} [deps.npcOnFigure] - the tap is on the NPC's opaque pixels (opaqueAt)
 * @param {function(object): boolean} [deps.givesWay] - the NPC is walking away (npcGivesWay)
 * @returns {{farObjects: Array<object>, farNpcs: Array<object>}}
 */
export function farUnderTap({ objectsUnderTap = [], npcUnderTap = null } = {}, deps) {
    const sameRoom = deps.sameRoom || (() => true);
    const isSeat = deps.isSeat || (() => false);
    const onFigure = deps.npcOnFigure || (() => true);
    const givesWay = deps.givesWay || (() => false);
    const farObjects = (objectsUnderTap || []).filter(o => o && !deps.inReach(o) && !isSeat(o) && sameRoom(o));
    const farNpcs = npcUnderTap && !deps.inReach(npcUnderTap) && sameRoom(npcUnderTap)
        && onFigure(npcUnderTap) && !givesWay(npcUnderTap) ? [npcUnderTap] : [];
    return { farObjects, farNpcs };
}

/**
 * The pick list for a tap. When an out-of-reach object or NPC is under the tap (farUnderTap),
 * in-reach candidates that are only near the tap drop out; those under it stay. Far objects
 * join them as "walk there, then use" entries, unless an in-reach NPC is under the tap (on
 * her figure and not covered there by an object drawn above her, candidate.isNpc): she wins
 * and is talked to, with no menu (Sarah over the far m01 Building Directory, code review R1
 * M1, R2 M2). An in-reach object under the tap on its own pixels (candidate.onObjectPixels)
 * drops in-reach NPCs that are not under the tap, far or not (R2 m1), so a tap on a memo
 * drawn over her opens the memo. An in-reach hostile NPC near the tap wins
 * outright: the list is returned as gathered, so combat is as before (a jab, or the same
 * menu as before when two things in reach share the tap). A far NPC joins no menu: it is
 * walked to, never picked from a list. With nothing in reach under the tap the list is
 * empty and the NPC or object branch walks to the thing under the pointer.
 *
 * @param {Array<{underTap?:boolean,isNpc?:boolean,hostile?:boolean,isObject?:boolean,isChair?:boolean,onObjectPixels?:boolean}>} candidates - the in-reach pick list near the tap
 * @param {Array<object>} farObjects - out-of-reach interactable objects whose bounds hold the tap
 * @param {function(object): object} toCandidate - a pick-list entry for a far object (walk, then use)
 * @param {Array<object>} [farOthers] - other out-of-reach things under the tap (an NPC)
 * @returns {Array} the pick list
 */
export function tapPickList(candidates, farObjects, toCandidate, farOthers = []) {
    const list = Array.isArray(candidates) ? candidates : [];
    const far = Array.isArray(farObjects) ? farObjects : [];
    const others = Array.isArray(farOthers) ? farOthers.filter(Boolean) : [];
    if (list.some(c => c && c.hostile)) return list;
    // An in-reach object under the tap on its own pixels is what the player points at: an
    // NPC only near the tap, or covered by it there, leaves the list (code review R2 m1)
    const pointedAt = list.some(c => c && c.isObject && !c.isChair && c.onObjectPixels);
    const kept = pointedAt ? list.filter(c => !(c && c.isNpc && !c.underTap)) : list;
    if (!far.length && !others.length) return kept;
    const under = kept.filter(c => c && c.underTap);
    if (!under.length) return [];
    if (under.some(c => c.isNpc)) return under;
    return [...under, ...far.map(toCandidate)];
}

/**
 * Whether an NPC under the tap gives it to an interactable object under the same tap (code
 * review R1 m3): the object is drawn above her and the tap is on its pixels, or the tap is on
 * the empty part of her frame. A hostile NPC never gives way (she is struck). Seats are left
 * out (a seated NPC's own chair), and so are objects of another room.
 *
 * @param {object} npc
 * @param {Array<object>} objectsUnderTap
 * @param {object} deps
 * @param {function(object): boolean} deps.onPixels - the tap is on the sprite's opaque pixels (opaqueAt)
 * @param {function(object): boolean} [deps.hostile]
 * @param {function(object): boolean} [deps.isSeat]
 * @param {function(object): boolean} [deps.sameRoom]
 * @returns {boolean}
 */
export function npcYieldsToObject(npc, objectsUnderTap, deps) {
    return !!npcYieldTarget(npc, objectsUnderTap, deps);
}

/**
 * The object an NPC under the tap gives it to (npcYieldsToObject), or null. The object branch
 * then uses or walks to this one, not merely the first under the tap (code review R2 n5).
 * deps.npcOnPixels, when given, is the test for her figure (opaqueNear); deps.onPixels is
 * used for the objects and, without npcOnPixels, for her too.
 *
 * @returns {?object}
 */
export function npcYieldTarget(npc, objectsUnderTap, deps) {
    if (!npc || !Array.isArray(objectsUnderTap) || !objectsUnderTap.length) return null;
    if (deps.hostile?.(npc)) return null;
    const isSeat = deps.isSeat || (() => false);
    const sameRoom = deps.sameRoom || (() => true);
    const objects = objectsUnderTap.filter(o => o && !isSeat(o) && sameRoom(o));
    if (!objects.length) return null;
    const onFigure = deps.npcOnPixels || deps.onPixels;
    if (!onFigure(npc)) return objects[0];
    const npcDepth = npc.depth || 0;
    return objects.find(o => (o.depth || 0) > npcDepth && deps.onPixels(o)) || null;
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
const STOPPED_SHORT_MS = 400;   // not moving this long, and out of reach: he stopped short
const BLOCKED_MS = 1000;        // on a path but the feet have not moved this long: blocked
const PROGRESS_PX = 2;          // feet movement that counts as progress

/**
 * An object tapped from out of reach: use it once the walk there ends in reach. Dropped
 * by any new tap (pointerdown clears it), the E key (player.js), when the walk stops short
 * (not moving and out of reach STOPPED_SHORT_MS after the last progress), when the walk is
 * blocked (on a path but no progress for BLOCKED_MS: walking into a seated owner), when
 * PENDING_TAP_USE_MS pass with no progress, when the object goes (taken, hidden, destroyed,
 * no longer interactable), or when something else takes over (deps.busy: a minigame, the
 * pick-one menu, a confirm dialog). The time limits count from the last progress of the
 * click-to-move walk, so a long walk that keeps moving is never cut short (code review R1
 * m5); keyboard walking is not progress (R2 M1).
 *
 * @param {object} deps
 * @param {function(object): boolean} deps.inReach - isObjectInInteractionRange
 * @param {function(): boolean} deps.isMoving - the player is on a click-to-move path
 * @param {function(object): void} deps.use - face the object and interact with it
 * @param {function(): boolean} [deps.busy] - a minigame, menu or dialog is open
 * @param {function(): boolean} [deps.minigameOpen] - older name for busy
 * @param {function(): ?{x:number,y:number}} [deps.feet] - the player's feet, for progress
 * @param {function(object): void} [deps.onBlocked] - the walk was blocked: say why (R2 m4)
 */
export function createPendingTapUse(deps) {
    let pending = null;
    const busy = deps.busy || deps.minigameOpen || (() => false);
    const feetNow = () => { try { return deps.feet?.() || null; } catch (e) { return null; } };
    return {
        arm(obj, at = Date.now()) {
            pending = obj ? { obj, at, progressAt: at, feet: feetNow() } : null;
        },
        clear() { pending = null; },
        get() { return pending; },
        /** Run from the scene's update(). */
        update(now = Date.now()) {
            const p = pending;
            if (!p) return;
            const o = p.obj;
            const f = feetNow();
            // Only a click-to-move walk counts: keyboard walking cancels that walk, so it
            // never keeps the use alive (code review R2 M1; player.js also clears it)
            if (deps.isMoving() && f && (!p.feet || Math.hypot(f.x - p.feet.x, f.y - p.feet.y) >= PROGRESS_PX)) {
                p.feet = f; p.progressAt = now;
            }
            const still = now - p.progressAt;
            if (still > PENDING_TAP_USE_MS || !o || o.destroyed || o.active === false
                || o.visible === false || !o.interactable) { pending = null; return; }
            if (busy()) { pending = null; return; }
            if (deps.isMoving()) {
                if (deps.feet && still > BLOCKED_MS) {
                    pending = null;
                    try { deps.onBlocked?.(o); } catch (e) { /* the message only */ }
                }
                return;
            }
            if (deps.inReach(o)) { pending = null; deps.use(o); return; }
            if (still > STOPPED_SHORT_MS) pending = null;
        }
    };
}
