/**
 * Player drop action: an inventory item with `"droppable": true` is placed in the
 * world at the player's feet when clicked in the inventory. It becomes an
 * ordinary takeable world object (the player can pick it up again), and an NPC
 * with a matching `interests` tag can notice, collect and use it
 * (npc-needs.js). The item only carries its `needsTag`; what it is and what
 * using it means is up to the scenario.
 *
 * A magnet (affordance.magnet) dropped within a tile of a table lands on the table
 * top instead (slice 23, table-drop.js), drawn over the table. The server keeps
 * position x and y only, so the needs system re-raises a magnet on a table when it
 * registers it after a reload (settleOnTable).
 *
 * Emits `item_dropped:<itemId>` { itemId, tag, roomId, x, y, onTable }.
 *
 * Persistence: the drop is saved as a room object (update_room add_object,
 * sourceType 'player_drop', which the server only accepts for a held droppable
 * item) and then removed from the server inventory, so the world item and the
 * emptied slot both survive a reload. A pickup removes it the usual way
 * (inventory.js -> RoomStateSync.removeItemFromRoom); an NPC consuming it does
 * the same (npc-needs.js consumeHeld).
 *
 * Picture: the item's own, chosen as the tray and a reload choose it (its
 * `sprite`, else its `type`; inventory.js inventoryImageKey, rooms.js). The picture
 * is resolved before the drop is placed, because its size decides where it sits
 * (table-drop.js snaps by sprite size). One that is not loaded yet is loaded on
 * demand: the neutral `dropped_item` picture stands in at the feet while it loads,
 * and the placement, the save and the item_dropped event wait for it. Only a
 * missing file keeps the neutral picture, never a key.
 *
 * Reached as window.dropInventoryItem (interactions.js); game.js imports it
 * dynamically. Its one static import, table-drop.js, has none of its own, so it
 * can be tested in node.
 */

import { snapToTable, spriteRect, savedPosition, placedDepth, tableUnder, edgeCell, TABLE_DEPTH_STEP } from './table-drop.js';

const TILE = 32;

/** The room's tables as plain rectangles for table-drop.js (front from table_surfaces.json when listed). */
export function roomTables(room, surfaces) {
    const out = [];
    for (const [key, sp] of Object.entries(room?.objects || {})) {
        if (!sp || sp.destroyed || sp.active === false || sp.scenarioData?.type !== 'table') continue;
        const r = spriteRect(sp);
        if (!(r.w > 0) || !(r.h > 0)) continue;
        const front = surfaces?.sprites?.[sp.texture?.key]?.front;
        out.push({ id: sp.objectId || key, ...r, depth: sp.depth ?? (r.y + r.h + 0.5), front });
    }
    return out.sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

/** Rectangles of the other shown objects in the room (not tables, not `except`). */
function roomObstacles(room, except) {
    const out = [];
    for (const sp of Object.values(room?.objects || {})) {
        if (!sp || sp === except || sp.destroyed || sp.active === false || sp.visible === false) continue;
        if (sp.scenarioData?.type === 'table') continue;
        const r = spriteRect(sp);
        if (r.w > 0 && r.h > 0) out.push(r);
    }
    return out;
}

const isMagnet = data => !!(data?.affordance && typeof data.affordance.magnet === 'object' && data.affordance.magnet);

/** The neutral picture of a dropped item whose own picture file is missing. */
export const DROPPED_ITEM_TEXTURE = 'dropped_item';

/**
 * The picture a dropped item shows: its `sprite`, else its `type`. The same rule
 * as inventory.js inventoryImageKey and the room builder (rooms.js), so the
 * tray, the floor and a reload agree.
 */
export function dropTextureKey(data) {
    const named = data?.sprite;
    if (typeof named === 'string' && named) return named;
    return (typeof data?.type === 'string' && data.type) ? data.type : DROPPED_ITEM_TEXTURE;
}

/**
 * Make sure `key` is a loaded texture, then call apply(textureKey) once: at once
 * when it is loaded, after an on-demand load of objects/<key>.png otherwise (the
 * pattern of rooms.js for a variant picture), and with DROPPED_ITEM_TEXTURE
 * (loaded the same way) when that file is missing. Returns 'ready' when apply ran
 * at once, 'loading' otherwise.
 */
export function ensureDropTexture(scene, key, apply) {
    const textures = scene?.textures;
    const load = scene?.load;
    if (textures?.exists(key)) { apply(key); return 'ready'; }
    if (!load) { apply(DROPPED_ITEM_TEXTURE); return 'ready'; }
    let done = false;
    const loadOne = (k, onOk, onFail) => {
        const onError = (file) => {
            if (file?.key !== k) return;
            load.off('loaderror', onError);
            load.off(`filecomplete-image-${k}`, onComplete);
            onFail?.();
        };
        const onComplete = () => {
            load.off('loaderror', onError);
            onOk();
        };
        load.on('loaderror', onError);
        load.once(`filecomplete-image-${k}`, onComplete);
        load.image(k, `objects/${k}.png`);
        load.start();
    };
    const finish = (k) => { if (!done) { done = true; apply(k); } };
    const fallback = () => {
        if (textures?.exists(DROPPED_ITEM_TEXTURE)) { finish(DROPPED_ITEM_TEXTURE); return; }
        loadOne(DROPPED_ITEM_TEXTURE, () => finish(DROPPED_ITEM_TEXTURE), () => finish('__DEFAULT'));
    };
    if (key === DROPPED_ITEM_TEXTURE) { fallback(); return 'loading'; }
    loadOne(key, () => finish(key), fallback);
    return 'loading';
}

/** True when a clicked inventory element should be dropped rather than used. */
export function isDroppableInventoryItem(sprite, inventoryItems) {
    if (!sprite?.scenarioData || sprite.scenarioData.droppable !== true) return false;
    return Array.isArray(inventoryItems) && inventoryItems.includes(sprite);
}

/**
 * How far below the feet (body centre) a drop is aimed, px: one pathfinding cell. The item
 * lands in front of the player's feet, its bottom below theirs, so it draws in front of
 * the player and shows (UX slice 15, R15: main3-12 had a stick hidden under the head).
 */
export const DROP_AHEAD_PX = 8;

/**
 * How much of a drop's box another thing may cover before the spot is refused: a quarter.
 * A desk's collision strip or a chair drawn over a corner of the item leaves it readable;
 * more than that hides it (UX slice 15 R1, M1).
 */
export const DROP_COVER_LIMIT = 0.25;

const overlapArea = (a, b) =>
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/** The item-sized box (whole-pixel top-left, as the drop is placed) of a drop centred at p. */
export function dropBox(p, size) {
    return { x: Math.round(p.x - size.w / 2), y: Math.round(p.y - size.h / 2), w: size.w, h: size.h };
}

/**
 * True when a drop of `size` centred at `p` shows: its box lies inside `roomRect` (when
 * given), no rectangle in `bodies` (static and immovable physics bodies) covers more than
 * DROP_COVER_LIMIT of it, and no prop in `props` drawn over it (depth above the item's
 * floor depth, table-drop.js placedDepth) covers more than that.
 */
export function dropSpotClear(p, size, { roomRect = null, bodies = [], props = [] } = {}) {
    const box = dropBox(p, size);
    const area = box.w * box.h;
    if (!(area > 0)) return true;
    if (roomRect && (box.x < roomRect.x || box.y < roomRect.y ||
        box.x + box.w > roomRect.x + roomRect.w || box.y + box.h > roomRect.y + roomRect.h)) return false;
    const limit = area * DROP_COVER_LIMIT;
    if (bodies.some(b => overlapArea(box, b) > limit)) return false;
    const depth = placedDepth(box.y, box.h, 0, roomRect?.y ?? 0);
    return !props.some(o => o.depth > depth && overlapArea(box, o) > limit);
}

const insideRect = (p, r) => !r || (p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);

/**
 * The wider drop candidates, as [dx, dy] in cells from the feet (y grows south), after the
 * aim, the feet and the two side cells (UX slice 15 R1 ruling): first the four diagonals,
 * then the 16 cells two steps out. Within each ring: in front (south) before level before
 * behind, then nearer, then further south, then the side the player faces (`facing` containing 'left' or
 * 'right'; with neither, left first).
 */
export function dropRingOffsets(facing = null) {
    const side = /left/.test(facing || '') ? -1 : /right/.test(facing || '') ? 1 : -1;
    const rank = ([dx, dy]) => [dy > 0 ? 0 : dy === 0 ? 1 : 2, dx * dx + dy * dy, -dy, dx * side > 0 ? 0 : dx === 0 ? 1 : 2];
    const byRank = (a, b) => {
        const ra = rank(a), rb = rank(b);
        for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
        return 0;
    };
    const ring1 = [[-1, 1], [1, 1], [-1, -1], [1, -1]].sort(byRank);
    const ring2 = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === 2) ring2.push([dx, dy]);
    }
    return [...ring1, ...ring2.sort(byRank)];
}

/**
 * Where the drop lands, so that it always shows (R15; UX slice 15 R1, M1, m4, n3).
 * Candidates in order: the aim (one cell below the feet, so the item draws in front of
 * the player), the feet, then one cell left and right of the feet; then the cells one step
 * diagonally, then the ring two steps out (DROP_RING_OFFSETS: in front before behind, then
 * nearer, then the side the player faces). Each is its own pathfinding cell (no wider
 * snap: a wider snap lands on a desk top or in the next room), and the first that is
 * walkable, inside the room and clear (dropSpotClear) wins. When none is, the player is
 * standing behind the same prop (the walk-behind convention) and the drop stays with
 * them: the feet snapped to a walkable cell in the room, else the raw feet, never the raw
 * aim (which can be inside a wall or a desk's strip). That fallback's box is shifted into
 * the room when it sticks out (UX slice 15 R2, n1).
 *
 * A candidate whose box touches a rectangle in `opts.avoid` (a door sprite, another loaded
 * room's rectangle: the doorway strips where two rooms overlap, dropClearance) is skipped on
 * a first pass and taken only when no other candidate is clear (UX slice 15 R2, M1): an
 * item dropped there is drawn on a door gap or over the next room's wall.
 *
 * `opts`: { size: {w, h}, roomRect, bodies, props, avoid, facing } (dropClearance gathers
 * the middle five; `facing` is the player's direction, e.g. 'left', 'down-right').
 * With no pathfinder, candidates count as walkable.
 */
export function dropPoint(playerFeet, pathfindingManager, opts = {}) {
    const pm = pathfindingManager;
    const size = opts.size || { w: 16, h: 16 };
    const roomRect = opts.roomRect || null;
    const avoid = Array.isArray(opts.avoid) ? opts.avoid : [];
    const step = pm?.worldGridBounds?.step || DROP_AHEAD_PX;
    const feet = { x: playerFeet.x, y: playerFeet.y };
    const candidates = [
        { x: feet.x, y: feet.y + DROP_AHEAD_PX },
        feet,
        { x: feet.x - step, y: feet.y },
        { x: feet.x + step, y: feet.y },
        ...dropRingOffsets(opts.facing).map(([dx, dy]) => ({ x: feet.x + dx * step, y: feet.y + dy * step }))
    ];
    const snap = typeof pm?.findNearestWalkableWorldCell === 'function'
        ? (p, r) => pm.findNearestWalkableWorldCell(p.x, p.y, r)
        : (p) => ({ x: p.x, y: p.y });
    // Each candidate's cell is looked up once, however many passes read it
    const clear = [];
    for (const c of candidates) {
        const cell = snap(c, 0);
        const ok = !!cell && insideRect(cell, roomRect) && dropSpotClear(cell, size, { ...opts, roomRect });
        if (!ok) continue;
        if (!avoid.length) return { x: cell.x, y: cell.y };
        const box = dropBox(cell, size);
        if (!avoid.some(r => overlapArea(box, r) > 0)) return { x: cell.x, y: cell.y };
        clear.push(cell);
    }
    if (clear.length) return { x: clear[0].x, y: clear[0].y };
    const near = snap(feet, 2);
    return clampIntoRoom(near && insideRect(near, roomRect) ? { x: near.x, y: near.y } : feet, size, roomRect);
}

/** `p` moved so that the box of `size` centred on it lies inside `roomRect` (when it fits). */
export function clampIntoRoom(p, size, roomRect) {
    if (!roomRect) return p;
    const box = dropBox(p, size);
    let { x, y } = p;
    if (box.w <= roomRect.w) {
        if (box.x < roomRect.x) x += roomRect.x - box.x;
        else if (box.x + box.w > roomRect.x + roomRect.w) x -= box.x + box.w - (roomRect.x + roomRect.w);
    }
    if (box.h <= roomRect.h) {
        if (box.y < roomRect.y) y += roomRect.y - box.y;
        else if (box.y + box.h > roomRect.y + roomRect.h) y -= box.y + box.h - (roomRect.y + roomRect.h);
    }
    return { x, y };
}

/**
 * What a drop in `room` must keep clear of, for dropPoint: the room's rectangle, the
 * static and immovable physics bodies near the room (not the player's or an NPC's), and
 * the shown non-takeable room objects other than `except` (the drop itself), with their
 * depths. `avoid` (ranked last, not refused): the door sprites of the loaded rooms and the
 * other loaded rooms' rectangles that touch this room (`rooms`, default window.rooms).
 */
export function dropClearance(scene, room, except = null, player = null, rooms = (typeof window !== 'undefined' ? window.rooms : null)) {
    const out = { roomRect: null, bodies: [], props: [], avoid: [] };
    const rectOf = r => {
        const pos = r?.position;
        const wpx = r?.map?.widthInPixels, hpx = r?.map?.heightInPixels;
        return pos && wpx > 0 && hpx > 0 ? { x: pos.x, y: pos.y, w: wpx, h: hpx } : null;
    };
    out.roomRect = rectOf(room);
    // Only what can touch a drop box (inside the room) counts: the room grown by two cells
    // (UX slice 15 R2, n2: every static body in the world was 980 rectangles in a 23-room map)
    const reach = out.roomRect ? { x: out.roomRect.x - 16, y: out.roomRect.y - 16, w: out.roomRect.w + 32, h: out.roomRect.h + 32 } : null;
    const near = r => !reach || overlapArea(r, reach) > 0;
    const keep = body => body && body.enable !== false && body.gameObject !== player && !body.gameObject?.npcId;
    const add = body => {
        const r = { x: body.left, y: body.top, w: body.right - body.left, h: body.bottom - body.top };
        if (near(r)) out.bodies.push(r);
    };
    for (const other of Object.values(rooms || {})) {
        if (!other) continue;
        for (const d of other.doorSprites || []) {
            if (!d || d.destroyed || d.active === false) continue;
            const r = spriteRect(d);
            if (r.w > 0 && r.h > 0 && near(r)) out.avoid.push(r);
        }
        if (other === room || !out.roomRect) continue;
        const r = rectOf(other);
        if (r && overlapArea(r, out.roomRect) > 0) out.avoid.push(r);
    }
    const world = scene?.physics?.world;
    world?.staticBodies?.iterate?.(body => { if (keep(body)) add(body); });
    world?.bodies?.iterate?.(body => { if (keep(body) && body.immovable) add(body); });
    for (const sp of Object.values(room?.objects || {})) {
        if (!sp || sp === except || sp.destroyed || sp.active === false || sp.visible === false) continue;
        if (sp.scenarioData?.takeable === true || sp.takeable === true) continue;
        const r = spriteRect(sp);
        if (r.w > 0 && r.h > 0 && Number.isFinite(sp.depth)) out.props.push({ ...r, depth: sp.depth });
    }
    return out;
}

/**
 * Save the drop on the server: add the room object, then remove the inventory
 * entry (in that order: the server validates the add against the held item).
 * Resolves true when both succeeded. Never throws; a failed sync leaves the
 * local drop in place and the server still holding the item in the inventory.
 */
export async function persistDrop(w, roomId, room, obj, worldData, at, position) {
    const gameId = w.breakEscapeConfig?.gameId;
    if (!gameId || !w.RoomStateSync || !worldData.id) return false;
    try {
        const added = await w.RoomStateSync.addItemToRoom(roomId, {
            id: worldData.id,
            type: worldData.type,
            name: worldData.name,
            // No texture: the saved drop is drawn from the item's own sprite or type on a
            // reload (rooms.js), and the server keeps no client texture (game.rb).
            x: at.x,
            y: at.y,
            // Room-relative tile position of the top-left (and elevation on a table):
            // what rooms.js uses to place it on reload (table-drop.js savedPosition)
            position,
            takeable: true,
            interactable: true
        }, { sourceType: 'player_drop' });
        if (!added) return false;
        const resp = await fetch(`/break_escape/games/${gameId}/inventory`, {
            method: 'POST',
            credentials: 'same-origin',
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify({ action_type: 'remove', item: { id: worldData.id } })
        });
        const result = await resp.json();
        return !!result.success;
    } catch (err) {
        console.error('[drop] failed to sync the drop to the server:', err);
        return false;
    }
}

/**
 * Put a drop that never landed back in the tray. The server still holds the item
 * (nothing was saved), so the stand-in is marked _restoredFromSave: addToInventory
 * then neither asks the server again nor re-runs its pickup actions, as for an item
 * restored on a reload. An item already back in the tray (picked up before the
 * sprite went) is not added twice. Returns true when it was put back.
 */
export function returnToTray(w, data) {
    if (!data || typeof w?.addToInventory !== 'function') return false;
    const held = (w.inventory?.items || []).some(it => it?.scenarioData && (
        it.scenarioData === data || (data.id && it.scenarioData.id === data.id)));
    if (held) return false;
    const key = dropTextureKey(data);
    w.addToInventory({
        name: data.type,
        objectId: `inventory_${data.id || data.type || 'item'}_${Date.now()}`,
        scenarioData: { ...data, takeable: false },
        texture: { key },
        _restoredFromSave: true,
        setVisible() { return this; }
    });
    return true;
}

export function dropInventoryItem(sprite) {
    const w = window;
    const scene = w.game;
    const player = w.player;
    const roomId = w.currentPlayerRoom;
    const room = roomId ? w.rooms?.[roomId] : null;
    if (!scene || !player || !room) {
        console.warn('[drop] no scene, player or room to drop into');
        return null;
    }
    const data = { ...(sprite.scenarioData || {}) };
    const feet = { x: player.body?.center?.x ?? player.x, y: player.body?.center?.y ?? player.y };

    // The item's own picture (see dropTextureKey). The tray element is a DOM <img>
    // with no texture, and its `type` (for a device, "usb") is often no picture at all.
    const textureKey = dropTextureKey(data);
    const loaded = scene.textures.exists(textureKey);
    const firstTexture = loaded ? textureKey
        : (scene.textures.exists(DROPPED_ITEM_TEXTURE) ? DROPPED_ITEM_TEXTURE : '__DEFAULT');
    // A first spot for the stand-in; place() picks again with the item's own size
    const at0 = dropPoint(feet, w.pathfindingManager, { size: { w: TILE / 2, h: TILE / 2 }, facing: player.direction, ...dropClearance(scene, room, null, player) });

    if (!w.removeFromInventory?.(sprite)) {
        console.warn('[drop] item was not in the inventory');
        return null;
    }

    const obj = scene.add.sprite(at0.x, at0.y, firstTexture);
    obj.setOrigin(0.5, 0.5);
    const worldData = { ...data, takeable: true, active: true, visible: true, interactable: true };
    obj.scenarioData = worldData;
    obj.objectId = data.id || `dropped_${data.type || 'item'}_${Date.now()}`;
    obj.name = worldData.name || worldData.type;
    obj.type = worldData.type;
    obj.takeable = true;
    obj.interactable = true;
    obj.roomId = roomId;
    obj.setInteractive({ useHandCursor: true });
    obj.elevation = 0;
    obj.setDepth(at0.y + (obj.displayHeight || TILE) / 2 + 0.5);
    room.objects = room.objects || {};
    room.objects[obj.objectId] = obj;

    const payload = {
        itemId: obj.objectId,
        tag: typeof worldData.needsTag === 'string' ? worldData.needsTag : null,
        roomId,
        x: Math.round(at0.x),
        y: Math.round(at0.y),
        onTable: null
    };

    // Place, save and announce the drop once its own picture is on, since the table snap
    // and the saved top-left go by the sprite's size. At once for a loaded picture.
    const place = (key) => {
        if (key !== firstTexture) obj.setTexture(key);
        const size = { w: obj.displayWidth || TILE, h: obj.displayHeight || TILE };
        // Slice 23: a magnet beside a table goes on the table top
        let snap = null;
        if (isMagnet(data)) {
            const tables = roomTables(room, scene.cache?.json?.get?.('tableSurfaces'));
            const pm = w.pathfindingManager;
            const nw = pm?.findNearestWalkableWorldCell ? (x, y, r) => pm.findNearestWalkableWorldCell(x, y, r) : null;
            // Only a table someone can stand at (eaters use it from its edge)
            const usable = nw ? (t => !!edgeCell({ x: feet.x, y: t.y }, t, tables, nw)) : null;
            snap = snapToTable(feet, tables, size, roomObstacles(room, obj), usable);
        }
        // On the floor: the first clear spot for this size (dropPoint), so it shows
        const spot = snap ? null : dropPoint(feet, w.pathfindingManager, { size, facing: player.direction, ...dropClearance(scene, room, obj, player) });
        // Whole-pixel top-left, so the saved position reloads to the same place
        const left = snap ? snap.left : Math.round(spot.x - size.w / 2);
        const top = snap ? snap.top : Math.round(spot.y - size.h / 2);
        const elevation = snap ? snap.elevation : 0;
        obj.setPosition(left + size.w / 2, top + size.h / 2);
        const at = { x: obj.x, y: obj.y };
        obj.elevation = elevation;
        obj.setDepth(placedDepth(top, size.h, elevation, room.position?.y ?? 0));
        Object.assign(payload, { x: Math.round(at.x), y: Math.round(at.y), onTable: snap ? snap.tableId : null });
        const position = room.position ? savedPosition(left, top, room.position, elevation) : undefined;
        const sync = persistDrop(w, roomId, room, obj, worldData, at, position);
        w.eventDispatcher?.emit(`item_dropped:${obj.objectId}`, payload);
        console.log('[drop] dropped', payload);
        return sync;
    };

    if (loaded) {
        obj._dropSync = place(textureKey);
    } else {
        // Load the picture now, then place it. An item picked up again before then is
        // left alone: nothing is saved, so the server still holds it in the inventory.
        // A sprite torn down before then (the room unloaded, the scene restarted) was
        // not picked up, so the item would be in neither the tray nor the world for the
        // rest of the session: it goes back in the tray (returnToTray).
        obj._dropSync = new Promise((resolve) => {
            ensureDropTexture(scene, textureKey, (key) => {
                if (!obj.scene || obj.destroyed) {
                    if (room.objects?.[obj.objectId] === obj) delete room.objects[obj.objectId];
                    returnToTray(w, data);
                    resolve(false);
                    return;
                }
                if (obj.active === false) { resolve(false); return; }
                resolve(place(key));
            });
        });
    }
    w.gameAlert?.(`Dropped ${obj.name}`, 'info', '', 1500);
    return payload;
}

/**
 * For npc-needs.js approachCell (no static imports there): where an NPC stands to use
 * an item standing on a table, or null when it is not on one.
 */
export function tableApproach(sprite, room, nearestWalkable, surfaces) {
    if (!sprite || !room) return null;
    const tables = roomTables(room, surfaces);
    const r = spriteRect(sprite);
    const t = tableUnder(r, tables);
    if (!t) return null;
    return edgeCell({ x: r.x + r.w / 2, y: r.y + r.h / 2 }, t, tables, nearestWalkable);
}

/**
 * Draw an item standing on a table over it: the depth snapToTable gives, from the table
 * under the item's base. The server keeps only position x and y (games_controller
 * item_add_params), so a reloaded drop comes back with no elevation; the needs system
 * calls this when it registers a magnet (on a drop and on a room load). Returns the
 * elevation, or null when the item is not on a table (left as it is).
 */
export function settleOnTable(sprite, room, surfaces) {
    if (!sprite || !room || typeof sprite.setDepth !== 'function') return null;
    const r = spriteRect(sprite);
    const t = tableUnder(r, roomTables(room, surfaces));
    if (!t) return null;
    const elevation = Math.round((t.depth + TABLE_DEPTH_STEP - (r.y + r.h + 0.5)) * 1000) / 1000;
    // Centre origin, as at the drop: reach is measured to sprite.y, and from in front of
    // the table the top-left a reload gives (origin 0) is out of reach (38 px in game 981)
    if ((sprite.originX ?? 0.5) !== 0.5 || (sprite.originY ?? 0.5) !== 0.5) {
        sprite.setOrigin?.(0.5, 0.5);
        sprite.setPosition?.(r.x + r.w / 2, r.y + r.h / 2);
    }
    sprite.elevation = elevation;
    sprite.setDepth(placedDepth(r.y, r.h, elevation, room.position?.y ?? 0));
    return elevation;
}

if (typeof window !== 'undefined') {
    window.tableDrop = {
        settle: (sprite, roomId) => settleOnTable(sprite, window.rooms?.[roomId], window.game?.cache?.json?.get?.('tableSurfaces')),
        approach: (sprite, roomId, nearestWalkable) => tableApproach(sprite, window.rooms?.[roomId], nearestWalkable,
            window.game?.cache?.json?.get?.('tableSurfaces'))
    };
    window.dropInventoryItem = dropInventoryItem;
    window.isDroppableInventoryItem = isDroppableInventoryItem;
}
