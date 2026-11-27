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
 * under the tap too (a seated owner drawn over her PC) stay; a far thing never joins the
 * pick-one menu (out of reach, the player only walks). With none under the tap the list
 * is empty and the object branch walks to the far object.
 *
 * The overlap rule (pixelHits, soleHit, overlapStandPoint): a click on two or more things'
 * own opaque pixels, all out of reach, walks to a spot where every one is in reach and
 * stops; the next click there opens the menu. A far click on one thing's pixels goes to
 * that thing, whatever transparent corner is drawn over it.
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
 * allowing for origin, scale, rotation, flipX and flipY. Without a
 * texture test (alphaAt missing, or it answers null: a frame it cannot read) the bounds decide.
 *
 * @param {object} sprite - a Phaser sprite or image (x, y, originX/Y, scaleX/Y, flipX, frame, texture)
 * @param {number} worldX
 * @param {number} worldY
 * @param {function(number, number, string, (string|number)): ?number} [alphaAt] - scene.textures.getPixelAlpha
 * @param {object} [opts]
 * @param {boolean} [opts.unreadable=true] - the answer when the alpha cannot be read (no test, a
 *   stand-in texture, a null alpha). The overlap rule passes false: such a sprite is never a pixel
 *   hit (overlap plan D3); every older caller keeps the bounds answer.
 * @returns {boolean}
 */
export function opaqueAt(sprite, worldX, worldY, alphaAt, { unreadable = true } = {}) {
    if (!sprite) return false;
    const frame = sprite.frame || {};
    const w = frame.realWidth ?? sprite.width ?? 0;
    const h = frame.realHeight ?? sprite.height ?? 0;
    const sx = Math.abs(sprite.scaleX ?? 1) || 1;
    const sy = Math.abs(sprite.scaleY ?? 1) || 1;
    // Phaser rotates about the origin after scaling, so undo the rotation first (R3 n3; rooms.js
    // can rotate items from Tiled or a scenario's rotation, though no map or scenario does yet)
    let ox = worldX - sprite.x, oy = worldY - sprite.y;
    const rot = sprite.rotation || 0;
    if (rot) {
        const c = Math.cos(-rot), s = Math.sin(-rot);
        [ox, oy] = [ox * c - oy * s, ox * s + oy * c];
    }
    let lx = ox / sx + (sprite.originX ?? 0.5) * w;
    let ly = oy / sy + (sprite.originY ?? 0.5) * h;
    if (!(lx >= 0 && lx < w && ly >= 0 && ly < h)) return false;
    const key = sprite.texture?.key;
    // No pixel test without one, or for Phaser's stand-in textures: __MISSING draws only a
    // green outline, so its "figure" would be the outline (code review R2 n4)
    if (typeof alphaAt !== 'function' || !key || key === '__MISSING' || key === '__DEFAULT') return unreadable;
    // Phaser mirrors a flipped frame about its centre: local lx shows texel w - lx (R2 n1)
    if (sprite.flipX) lx = Math.min(w - lx, w - 1);
    if (sprite.flipY) ly = Math.min(h - ly, h - 1);       // the same about the other axis (R3 n3)
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
    if (a === null || a === undefined) return unreadable;
    return a > 0;
}

export const NPC_FIGURE_SLOP_PX = 2;

/**
 * Whether the tap is on an NPC's figure: an opaque pixel at the tap or within
 * NPC_FIGURE_SLOP_PX of it (a 5 x 5 square), so a touch that lands a pixel off her outline
 * still counts as her (code review R2 m5). Objects keep the exact test (opaqueAt).
 */
export function opaqueNear(sprite, worldX, worldY, alphaAt, slop = NPC_FIGURE_SLOP_PX, opts = {}) {
    if (opaqueAt(sprite, worldX, worldY, alphaAt, opts)) return true;
    const sx = Math.abs(sprite?.scaleX ?? 1) || 1;
    const sy = Math.abs(sprite?.scaleY ?? 1) || 1;
    for (let dy = -slop; dy <= slop; dy++) {
        for (let dx = -slop; dx <= slop; dx++) {
            if ((dx || dy) && opaqueAt(sprite, worldX + dx * sx, worldY + dy * sy, alphaAt, opts)) return true;
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
 * @param {Array<object>} [args.npcsUnderTap] - every NPC whose frame holds the tap (findNPCsAtPosition);
 *   when given it replaces npcUnderTap, so a far NPC on her figure behind a nearer frame counts
 * @param {object} deps
 * @param {function(object): boolean} deps.inReach
 * @param {function(object): boolean} [deps.isSeat]
 * @param {function(object): boolean} [deps.sameRoom] - in the player's own room (sameRoomFrom the feet)
 * @param {function(object): boolean} [deps.npcOnFigure] - the tap is on the NPC's opaque pixels (opaqueAt)
 * @param {function(object): boolean} [deps.givesWay] - the NPC is walking away (npcGivesWay)
 * @returns {{farObjects: Array<object>, farNpcs: Array<object>}}
 */
export function farUnderTap({ objectsUnderTap = [], npcUnderTap = null, npcsUnderTap = null } = {}, deps) {
    const sameRoom = deps.sameRoom || (() => true);
    const isSeat = deps.isSeat || (() => false);
    const onFigure = deps.npcOnFigure || (() => true);
    const givesWay = deps.givesWay || (() => false);
    const farObjects = (objectsUnderTap || []).filter(o => o && !deps.inReach(o) && !isSeat(o) && sameRoom(o));
    const npcs = Array.isArray(npcsUnderTap) ? npcsUnderTap : (npcUnderTap ? [npcUnderTap] : []);
    const farNpcs = npcs.filter(n => n && !deps.inReach(n) && sameRoom(n) && onFigure(n) && !givesWay(n));
    return { farObjects, farNpcs };
}

/**
 * The pick list for a tap: in-reach things only (overlap plan D1 rule 2, D5). When an
 * out-of-reach object or NPC is under the tap (farUnderTap), in-reach candidates that are only
 * near the tap drop out and those under it stay; a far thing never joins the list (the user's
 * rule: out of reach, just walk there). When the only in-reach things under the tap are seats
 * and a far object is under it too, the list is empty and the object branch walks to the far
 * object (seatsGiveWay, D6). A hostile NPC never joins a list (D12): the handler strikes or
 * walks towards one under the tap before it gathers. An in-reach object under the tap on its own
 * pixels (candidate.onObjectPixels) drops in-reach NPCs that are not under the tap (R2 m1).
 * With nothing far under the tap the list is returned as kept (the same array when nothing
 * was dropped).
 *
 * @param {Array<{underTap?:boolean,isNpc?:boolean,hostile?:boolean,isObject?:boolean,isChair?:boolean,onObjectPixels?:boolean}>} candidates - the in-reach pick list near the tap
 * @param {Array<object>} farObjects - out-of-reach interactable objects whose bounds hold the tap
 * @param {Array<object>} [farOthers] - other out-of-reach things under the tap (NPCs on their figure)
 * @returns {Array} the pick list
 */
export function tapPickList(candidates, farObjects, farOthers = []) {
    let list = Array.isArray(candidates) ? candidates : [];
    const far = Array.isArray(farObjects) ? farObjects : [];
    const others = Array.isArray(farOthers) ? farOthers.filter(Boolean) : [];
    // Filter only when there is one, so an unchanged list stays the same array (R4 m1)
    if (list.some(c => c && c.hostile)) list = list.filter(c => !(c && c.hostile));
    // An in-reach object under the tap on its own pixels is what the player points at: an
    // NPC only near the tap, or covered by it there, leaves the list (code review R2 m1)
    const pointedAt = list.some(c => c && c.isObject && !c.isChair && c.onObjectPixels);
    const kept = pointedAt ? list.filter(c => !(c && c.isNpc && !c.underTap)) : list;
    if (!far.length && !others.length) return kept;
    if (seatsGiveWay(kept, far)) return [];
    return kept.filter(c => c && c.underTap);
}

/**
 * Seats give way (overlap plan D6): true when a far non-seat object is under the tap and every
 * in-reach thing under the tap is a seat or swivel prop, with at least one of them (R4 m6: an
 * empty set must not reorder the object branch). The object branch then walks to the far object.
 *
 * @param {Array<{underTap?:boolean,isChair?:boolean}>} candidates - the in-reach list
 * @param {Array<object>} farObjects - far non-seat objects under the tap (farUnderTap)
 * @returns {boolean}
 */
export function seatsGiveWay(candidates, farObjects) {
    if (!Array.isArray(farObjects) || !farObjects.length) return false;
    const under = (Array.isArray(candidates) ? candidates : []).filter(c => c && c.underTap);
    return under.length > 0 && under.every(c => c.isChair);
}

/**
 * Every pixel hit under the tap (overlap plan section 3, D3): an object, NPC or shut door whose
 * own opaque pixels hold the tap, whatever is drawn above it, in the player's room. Stacked
 * copies collapse (D9). Topmost first (depth, then the order given: objects, NPCs, door).
 *
 * @param {object} under
 * @param {Array<object>} [under.objectsUnderTap] - objects whose bounds hold the tap (every one)
 * @param {Array<object>} [under.npcsUnderTap] - NPCs whose frame holds the tap (findNPCsAtPosition)
 * @param {?object} [under.doorUnderTap] - the door whose bounds hold the tap
 * @param {object} deps
 * @param {function(object): boolean} deps.onPixels - strict opaqueAt (unreadable is no hit)
 * @param {function(object): boolean} deps.npcOnFigure - strict opaqueNear
 * @param {function(object): boolean} [deps.sameRoom]
 * @param {function(object): boolean} [deps.isSeat] - seats and swivel props
 * @param {function(object): boolean} [deps.givesWay] - an NPC walking away from the player
 * @param {function(object): boolean} [deps.doorOpen]
 * @param {function(object): boolean} [deps.hostile]
 * @param {function(object): ?string} [deps.stackKey] - name, texture, frame and observations; null never collapses
 * @returns {{allHits: Array<object>, menuHits: Array<object>, hostileHit: ?object}}
 */
export function pixelHits({ objectsUnderTap = [], npcsUnderTap = [], doorUnderTap = null } = {}, deps) {
    const sameRoom = deps.sameRoom || (() => true);
    const isSeat = deps.isSeat || (() => false);
    const givesWay = deps.givesWay || (() => false);
    const doorOpen = deps.doorOpen || ((d) => !!d?.doorProperties?.open);
    const hostile = deps.hostile || (() => false);
    const stackKey = deps.stackKey || (() => null);
    const shown = (s) => s && !s.destroyed && s.active !== false && s.visible !== false && !(s.alpha <= 0);
    const hits = [];
    for (const o of objectsUnderTap || []) {
        if (shown(o) && o.interactable === true && sameRoom(o) && deps.onPixels(o)) hits.push(o);
    }
    let hostileHit = null;
    for (const n of npcsUnderTap || []) {
        if (!shown(n) || !sameRoom(n) || !deps.npcOnFigure(n)) continue;
        if (hostile(n)) { hostileHit = hostileHit || n; continue; }   // a hostile never joins a menu (D27)
        if (!givesWay(n)) hits.push(n);
    }
    if (doorUnderTap && shown(doorUnderTap) && !doorOpen(doorUnderTap) && deps.onPixels(doorUnderTap)) hits.push(doorUnderTap);
    const order = hits.map((h, i) => [h, i]).sort((a, b) => ((b[0].depth || 0) - (a[0].depth || 0)) || (a[1] - b[1]));
    const allHits = [];
    for (const [h] of order) {
        const k = stackKey(h);
        const twin = k != null && allHits.some(t => stackKey(t) === k
            && Math.abs((t.x || 0) - (h.x || 0)) <= 2 && Math.abs((t.y || 0) - (h.y || 0)) <= 2);
        if (!twin) allHits.push(h);
    }
    return { allHits, menuHits: allHits.filter(h => !isSeat(h)), hostileHit };
}

/**
 * The one thing a far click acts on (overlap plan D4): the only pixel hit, when it is not a seat
 * or swivel prop; otherwise null and today's order runs.
 */
export function soleHit({ allHits } = {}, isSeat = () => false) {
    return Array.isArray(allHits) && allHits.length === 1 && !isSeat(allHits[0]) ? allHits[0] : null;
}

/** Reach margins an overlap stand point is judged with, widest first (px inside the range) */
export const OVERLAP_MARGINS = [12, 8, 4, 0];
// Slack above this only buys a longer walk (review R3 m5): at 12 px inside the range the 8 px
// arrival error is covered with 4 px spare
const ARRIVAL_SLACK_CAP = 12;
// [margin, allow a cell with no clear straight line]
const OVERLAP_RANKING = [[12, false], [8, false], [12, true], [8, true], [4, false], [0, false], [4, true], [0, true]];

/**
 * Where to stand so every hit of a far overlap is in reach (overlap plan D2): at each margin in
 * OVERLAP_MARGINS (12, 8, 4, 0 px inside the range, widest first), the click point's stand
 * point, then each hit's own (topmost first), each from objectStandPoint; then, when none of
 * those reaches every hit at the widest margin, the walkable cells in the overlap of the hits' reach
 * boxes (deps.findCell on a 4 px lattice, nearest walk first) that deps.wallClear / deps.sameRoom
 * allow and deps.pathClear can walk to. At the highest margin where any point passes, the point
 * with the most slack (largest margin it still passes) wins among those whose walk is within 48 px
 * of the nearest passing one, ties to the shortest walk. Null only when no walkable cell reaches
 * them all.
 *
 * @param {Array<object>} hits - the menu hits, topmost first
 * @param {{x:number,y:number}} click
 * @param {object} player
 * @param {object} deps - objectStandPoint's deps, plus:
 * @param {function({x:number,y:number}, object, number=): boolean} deps.inReachFrom - the real reach
 *   from a feet point, judged `margin` px inside the range (default 12 when omitted)
 * @param {function({x:number,y:number}): boolean} [deps.pathClear] - the player can walk to a lattice
 *   cell (a clear straight line from the feet); a cell it rejects is skipped for the next
 * @param {function(object): ?{left:number,right:number,top:number,bottom:number}} [deps.reachSpan] - the
 *   span a hit's reach is measured to, in the player sprite's coordinates (a wide object's width, a
 *   wall-mounted object's height, a static NPC's body); absent, the hit's centre
 * @param {function(object): boolean} [deps.isDoor]
 * @param {number} [deps.doorRange] - DOOR_INTERACTION_RANGE
 * @param {function({x:number,y:number}): boolean} [deps.occupied] - the body would stand inside
 *   someone (an NPC's body): the walk cannot end there, so the point is skipped
 * @returns {?{x:number,y:number}}
 */
export function overlapStandPoint(hits, click, player, deps) {
    if (!Array.isArray(hits) || !hits.length) return null;
    const isDoor = deps.isDoor || ((h) => !!h?.doorProperties);
    const rangeFor = (t) => (isDoor(t) && deps.doorRange ? deps.doorRange : deps.range);
    const clickRange = hits.every(isDoor) && deps.doorRange ? deps.doorRange : deps.range;
    const targets = [[{ x: click.x, y: click.y }, clickRange], ...hits.map(h => [h, rangeFor(h)])];
    const named = [];
    for (const [t, range] of targets) {
        let p = null;
        try { p = objectStandPoint(t, player, { ...deps, range }); } catch (e) { p = null; }
        if (p) named.push(p);
    }
    const occupied = (p) => { try { return !!deps.occupied?.(p); } catch (e) { return false; } };
    const allIn = (p, margin) => hits.every(h => deps.inReachFrom(p, h, margin)) && !occupied(p);
    let cells = null;   // built once, only when no named point passes at the widest margin
    // Cells where every hit can be in reach lie in the overlap of the hits' reach boxes. The reach
    // is measured from the sprite centre, the walk steers the feet (fx, fy lower), so the box moves.
    const lattice = () => {
        if (cells) return cells;
        cells = [];
        if (typeof deps.findCell !== 'function') return cells;
        const wallClear = deps.wallClear || (() => true);
        const sameRoom = deps.sameRoom || (() => true);
        const fx = player?.body ? player.body.center.x - player.x : 0;
        const fy = player?.body ? player.body.center.y - player.y : 0;
        let x0 = -Infinity, y0 = -Infinity, x1 = Infinity, y1 = Infinity;
        for (const h of hits) {
            const r = rangeFor(h);
            // The span the hit's reach is measured to (a wide object's width, a wall fixture's
            // height, a static NPC's body), not only its centre (review R2 m1)
            let sp = null;
            try { sp = deps.reachSpan?.(h) || null; } catch (e) { sp = null; }
            const sl = sp ? Math.min(sp.left, h.x) : h.x, sr = sp ? Math.max(sp.right, h.x) : h.x;
            const st = sp ? Math.min(sp.top, h.y) : h.y, sb = sp ? Math.max(sp.bottom, h.y) : h.y;
            x0 = Math.max(x0, sl - r + fx); x1 = Math.min(x1, sr + r + fx);
            y0 = Math.max(y0, st - r + fy); y1 = Math.min(y1, sb + r + fy);
        }
        const from = { x: player.x + fx, y: player.y + fy };
        const seen = new Set();
        for (let y = y0; y <= y1; y += 4) {
            for (let x = x0; x <= x1; x += 4) {
                let c = null;
                try { c = deps.findCell(x, y, 0); } catch (e) { c = null; }
                if (!c) continue;
                const k = `${c.x},${c.y}`;
                if (seen.has(k)) continue;
                seen.add(k);
                if (!hits.every(h => wallClear(c, h) && sameRoom(c, h))) continue;
                cells.push({ p: c, walk: Math.hypot(c.x - from.x, c.y - from.y), lattice: true });
            }
        }
        cells.sort((a, b) => a.walk - b.walk);
        return cells;
    };
    const fromPt = (() => {
        const fx = player?.body ? player.body.center.x - player.x : 0;
        const fy = player?.body ? player.body.center.y - player.y : 0;
        return { x: player.x + fx, y: player.y + fy };
    })();
    const walkOf = (p) => Math.hypot(p.x - fromPt.x, p.y - fromPt.y);
    // Slack beats walk length only within MAX_EXTRA_WALK px of the nearest qualifying cell (code
    // review R5 m1): a cell across a desk island with 1 px more slack must not win
    const MAX_SLACK = ARRIVAL_SLACK_CAP;
    // Walk length is the straight line from the feet, not a path length (review R2 m3): the
    // pathfinder (findWorldPath) is asynchronous and this runs inside one click, and a path per
    // candidate cell would be hundreds of queries. A cell behind furniture is at least filtered
    // by pathClear; the cap keeps a detour small.
    const MAX_EXTRA_WALK = 48;
    const reachable = (c) => {
        if (!c.lattice || typeof deps.pathClear !== 'function') return true;
        if (c.clear === undefined) c.clear = !!deps.pathClear(c.p);   // once per cell, across the two passes
        return c.clear;
    };
    // fallback: allow a lattice cell with no clear straight line (last resort, see below)
    const pick = (pool, margin, fallback = false) => {
        const pass = pool.filter(c => allIn(c.p, margin)).sort((a, b) => a.walk - b.walk);
        if (!pass.length) return null;
        const near = pass.filter(c => c.walk <= pass[0].walk + MAX_EXTRA_WALK);
        for (const c of near) {
            c.slack = margin;
            while (c.slack < MAX_SLACK && allIn(c.p, c.slack + 1)) c.slack++;
        }
        near.sort((a, b) => (b.slack - a.slack) || (a.walk - b.walk));
        // Lattice cells also need a clear way there; the next best is taken when one has none
        for (const c of [...near, ...pass.filter(c => !near.includes(c))]) if (reachable(c)) return c.p;
        // None has a straight clear line, but the walk pathfinds around furniture (live check: the
        // lounge desks blocked every line to the only cells where Grace and Marek were both in
        // reach): the shortest walk is still better than no joint stand point
        return fallback ? near[0].p : null;
    };
    const namedPool = named.map(p => ({ p, walk: walkOf(p) }));
    // A named point with the widest margin wins outright; the lattice is only built when none has it
    const wide = pick(namedPool, OVERLAP_MARGINS[0]);
    if (wide) return wide;
    const pool = [...namedPool, ...lattice()];
    // Ranked by risk (review R3 m2): a clear line at the wide margins, then no line at the wide
    // margins, then the thin margins. A margin-0 cell can end 8 px out of reach; a no-line cell at
    // margin 12 was reached 14 of 14 times live (the pathfinder walks round furniture)
    for (const [margin, fallback] of OVERLAP_RANKING) {
        const p = pick(pool, margin, fallback);
        if (p) return p;
    }
    return null;
}

/**
 * The point the overlap walk's one retry step aims at. A click-to-move walk ends when the feet
 * are within `arrival` px (ARRIVAL_THRESHOLD, 8) of its target, so a retry to the same stand
 * point would stop at once with no movement (code review R5 M1). The target is instead
 * `arrival + 2` px past the stand point along the way the feet were heading, clamped to a
 * walkable cell from which every hit is still in reach; shorter overshoots are tried when that
 * one is not, and null when none moves the feet more than `arrival`.
 *
 * @param {{x:number,y:number}} feet - where the walk ended
 * @param {{x:number,y:number}} stand - the stand point the walk was aimed at
 * @param {Array<object>} hits - the hits still there
 * @param {object} deps
 * @param {function({x:number,y:number}, object, number=): boolean} deps.inReachFrom
 * @param {function(number, number, number=): ?{x:number,y:number}} [deps.findCell]
 * @param {number} [deps.arrival=8]
 * @param {function({x:number,y:number}): boolean} [deps.occupied]
 * @param {function({x:number,y:number}, object): boolean} [deps.sameRoom] - the cell is in the hit's room
 * @returns {?{x:number,y:number}}
 */
export function overlapRetryTarget(feet, stand, hits, deps) {
    if (!feet || !stand) return null;
    const arrival = deps.arrival ?? 8;
    const dx = stand.x - feet.x, dy = stand.y - feet.y;
    const len = Math.hypot(dx, dy);
    if (!(len > 0)) return null;
    const ux = dx / len, uy = dy / len;
    for (let over = arrival + 2; over >= 0; over -= 2) {
        const want = { x: stand.x + ux * over, y: stand.y + uy * over };
        let c = want;
        if (typeof deps.findCell === 'function') {
            try { c = deps.findCell(want.x, want.y, 1) || null; } catch (e) { c = null; }
        }
        if (!c) continue;
        if (Math.hypot(c.x - feet.x, c.y - feet.y) <= arrival) continue;
        if (!hits.every(h => deps.inReachFrom(c, h, 0))) continue;
        if (deps.occupied?.(c)) continue;
        if (deps.sameRoom && !hits.every(h => deps.sameRoom(c, h))) continue;
        return { x: c.x, y: c.y };
    }
    return null;
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
 * @param {function(object, number): number} [deps.reachY] - the y reach is measured to from a sprite-centre y
 *   (interaction-reach.js reachY: a tall wall-mounted object's nearest part); obj.y without it
 * @param {function({x:number,y:number}, object): boolean} [deps.wallClear] - no wall between the point and the object
 * @param {function({x:number,y:number}, object): boolean} [deps.sameRoom] - feet at the point stand in the object's
 *   room (interaction-walls.js sameRoomFrom). An object in the strip two rooms share (a drop in a doorway) is
 *   only used from its own room's side: a stand point across the line ended the walk in the other room, where
 *   the use is refused (UX slice 15 R2, M1).
 * @returns {?{x:number,y:number}} a feet target, or null when the player stands on the object
 */
export function objectStandPoint(obj, player, deps) {
    const range = deps.range;
    const wallClear = deps.wallClear || (() => true);
    const sameRoom = deps.sameRoom || (() => true);
    const usable = (p) => wallClear(p, obj) && sameRoom(p, obj);
    const footDx = player.body ? player.body.center.x - player.x : 0;
    const footDy = player.body ? player.body.center.y - player.y : 0;
    // Reach is measured to the object's nearest part (interactions.js isObjectInInteractionRange:
    // reachX, reachY), so judge and aim stand points the same way. A scenario object's origin is its
    // top-left, so a tall prop against the back wall is far from its top edge but near its base.
    const rx = typeof deps.reachX === 'function' ? (x) => deps.reachX(obj, x) : () => obj.x;
    const ry = typeof deps.reachY === 'function' ? (y) => deps.reachY(obj, y) : () => obj.y;
    const nx = rx(player.x), ny = ry(player.y);
    const dx = nx - player.x;
    const dy = ny - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Beside the object's body (the nearest part is on the player's own row and column): aim at its corner
    const aimX = distance > 0 ? nx : obj.x, aimY = distance > 0 ? ny : obj.y;
    const adx = aimX - player.x, ady = aimY - player.y;
    const adist = Math.sqrt(adx * adx + ady * ady);
    if (!(adist > 0)) return null;
    const stopShort = range / 2;
    const centreX = aimX - (adx / adist) * stopShort;
    const centreY = aimY - (ady / adist) * stopShort;
    const target = { x: centreX + footDx, y: centreY + footDy };
    const findCell = deps.findCell;
    if (!findCell) return target;
    const reachAfter = (p) => {
        const sx = p.x - footDx, sy = p.y - footDy;
        return Math.hypot(sx - rx(sx), sy - ry(sy));
    };
    const walk = (p) => Math.hypot(p.x - (player.x + footDx), p.y - (player.y + footDy));
    // Ring centres: the object's origin, plus points across its footprint (a 60px cabinet's base is
    // far from its top-left corner, and the rings only reach 24px)
    const centres = [{ x: obj.x, y: obj.y }];
    if (deps.reachX && deps.reachY) {
        const far = 1000000;
        const L = rx(-far), R = rx(far), T = ry(-far), B = ry(far);
        if (R - L > 0 || B - T > 0) {
            for (const fx of [0, 0.5, 1]) for (const fy of [0, 0.5, 1]) {
                const c = { x: L + (R - L) * fx, y: T + (B - T) * fy };
                if (!centres.some(o => Math.abs(o.x - c.x) < 1 && Math.abs(o.y - c.y) < 1)) centres.push(c);
            }
        }
    }
    const aimed = findCell(target.x, target.y);
    // Return the cell that was checked, not the raw aim: the raw aim can lie inside a desk,
    // and the walk's last leg heads for it and stops short (code review R3 m1)
    if (aimed && reachAfter(aimed) <= range - 4 && usable(aimed)) return aimed;
    let best = aimed, bestReach = aimed ? reachAfter(aimed) : Infinity, bestWalk = aimed ? walk(aimed) : Infinity;
    for (const ctr of centres) for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2;
        for (const r of [8, 16, 24]) {
            const c = findCell(ctr.x + Math.cos(ang) * r + footDx, ctr.y + Math.sin(ang) * r + footDy, 3);
            if (!c) continue;
            const ra = reachAfter(c), wk = walk(c);
            const ok = ra <= range - 4 && usable(c);
            const bestOk = bestReach <= range - 4 && usable(best);
            if ((ok && (!bestOk || wk < bestWalk)) || (!ok && !bestOk && ra < bestReach)) {
                best = c; bestReach = ra; bestWalk = wk;
            }
        }
    }
    if (best && bestReach <= range - 4 && usable(best)) return best;
    // Nothing usable with the margin. Only for a `sameRoom` rule: an object at the foot of
    // its room's floor, in the strip over the next room's back wall, is in reach of only a
    // narrow band of feet points on its own side (the arrival check, interactions.js
    // isObjectInInteractionRange, is the plain centre distance within the range). Look north
    // of it for a usable point within the range itself, nearest walk first (UX slice 15 R2, M1).
    if (deps.sameRoom) {
        const aimOx = obj.x, aimOy = obj.y;
        let edge = null, edgeWalk = Infinity;
        for (let a = 0; a < 16; a++) {
            const ang = (a / 16) * Math.PI * 2;
            if (Math.sin(ang) >= 0) continue;    // only points north of the object
            for (const r of [20, 24, 28, 30, 31]) {
                const c = findCell(aimOx + Math.cos(ang) * r + footDx, aimOy + Math.sin(ang) * r + footDy, 3);
                if (!c || reachAfter(c) > range - 1 || !usable(c)) continue;
                const wk = walk(c);
                if (wk < edgeWalk) { edge = c; edgeWalk = wk; }
            }
        }
        if (edge) return edge;
    }
    return best || target;
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
 * @param {function(object): void} [deps.onStoppedShort] - the walk ended out of reach: say so (R3 m1)
 * @param {function(object): boolean} [deps.onPartial] - inReach was false: return true after starting one
 *   more step, which keeps the walk pending (the overlap walk's retry, review R5 n3)
 * @param {function(object): boolean} [deps.alive] - the target is still there; replaces the object
 *   check, so the target can be a list (the overlap walk's hits, overlap plan D2)
 */
export function createPendingTapUse(deps) {
    let pending = null;
    const busy = deps.busy || deps.minigameOpen || (() => false);
    const alive = deps.alive || ((o) => !!o && !o.destroyed && o.active !== false && o.visible !== false && !!o.interactable);
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
            if (still > PENDING_TAP_USE_MS || !o || !alive(o)) { pending = null; return; }
            if (busy()) { pending = null; return; }
            if (deps.isMoving()) {
                if (deps.feet && still > BLOCKED_MS) {
                    pending = null;
                    try { deps.onBlocked?.(o); } catch (e) { /* the message only */ }
                }
                return;
            }
            if (deps.inReach(o, now)) { pending = null; deps.use(o); return; }
            // Stopped with part of the target in reach: one more step may be started (overlap walk)
            if (deps.onPartial) {
                let more = false;
                try { more = !!deps.onPartial(o, now); } catch (e) { more = false; }
                if (more) { p.progressAt = now; p.feet = feetNow(); return; }
            }
            if (still > STOPPED_SHORT_MS) {
                pending = null;
                // Say why, not drop it silently (code review R3 m1)
                try { deps.onStoppedShort?.(o); } catch (e) { /* the message only */ }
            }
        }
    };
}
