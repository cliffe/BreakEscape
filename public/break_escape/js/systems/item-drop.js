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

/** Where the drop lands: the player's feet (body centre), snapped to a walkable cell. */
export function dropPoint(playerFeet, pathfindingManager) {
    const near = pathfindingManager?.findNearestWalkableWorldCell?.(playerFeet.x, playerFeet.y, 2);
    return near || { x: playerFeet.x, y: playerFeet.y };
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
    const at0 = dropPoint(feet, w.pathfindingManager);

    // The item's own picture (see dropTextureKey). The tray element is a DOM <img>
    // with no texture, and its `type` (for a device, "usb") is often no picture at all.
    const textureKey = dropTextureKey(data);
    const loaded = scene.textures.exists(textureKey);
    const firstTexture = loaded ? textureKey
        : (scene.textures.exists(DROPPED_ITEM_TEXTURE) ? DROPPED_ITEM_TEXTURE : '__DEFAULT');

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
        // Whole-pixel top-left, so the saved position reloads to the same place
        const left = snap ? snap.left : Math.round(at0.x - size.w / 2);
        const top = snap ? snap.top : Math.round(at0.y - size.h / 2);
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
        obj._dropSync = new Promise((resolve) => {
            ensureDropTexture(scene, textureKey, (key) => {
                if (!obj.scene || obj.destroyed || obj.active === false) { resolve(false); return; }
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
