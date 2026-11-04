/**
 * Player drop action: an inventory item with `"droppable": true` is placed in the
 * world at the player's feet when clicked in the inventory. It becomes an
 * ordinary takeable world object (the player can pick it up again), and an NPC
 * with a matching `interests` tag can notice, collect and use it
 * (npc-needs.js). The item only carries its `needsTag`; what it is and what
 * using it means is up to the scenario.
 *
 * Emits `item_dropped:<itemId>` { itemId, tag, roomId, x, y }.
 *
 * Client-side only for now: the server still counts the item as held, so after
 * a reload a dropped (and not yet collected) item is back in the inventory.
 *
 * No static imports: interactions.js reaches it as window.dropInventoryItem.
 */

const TILE = 32;

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
    const at = dropPoint(feet, w.pathfindingManager);

    let texture = data.texture || sprite.texture?.key || data.type || 'key';
    if (!scene.textures.exists(texture)) texture = scene.textures.exists(data.type) ? data.type : 'key';

    if (!w.removeFromInventory?.(sprite)) {
        console.warn('[drop] item was not in the inventory');
        return null;
    }

    const obj = scene.add.sprite(at.x, at.y, texture);
    obj.setOrigin(0.5, 0.5);
    const worldData = { ...data, takeable: true, active: true, visible: true, interactable: true };
    obj.scenarioData = worldData;
    obj.objectId = data.id || `dropped_${data.type || 'item'}_${Date.now()}`;
    obj.name = worldData.name || worldData.type;
    obj.type = worldData.type;
    obj.takeable = true;
    obj.interactable = true;
    obj.roomId = roomId;
    obj.texture = { key: texture, _phaserTexture: obj.texture };
    obj.setInteractive({ useHandCursor: true });
    obj.setDepth(at.y + (obj.displayHeight || TILE) / 2 + 0.5);
    room.objects = room.objects || {};
    room.objects[obj.objectId] = obj;

    const payload = {
        itemId: obj.objectId,
        tag: typeof worldData.needsTag === 'string' ? worldData.needsTag : null,
        roomId,
        x: Math.round(at.x),
        y: Math.round(at.y)
    };
    w.eventDispatcher?.emit(`item_dropped:${obj.objectId}`, payload);
    w.gameAlert?.(`Dropped ${obj.name}`, 'info', '', 1500);
    console.log('[drop] dropped', payload);
    return payload;
}

if (typeof window !== 'undefined') {
    window.dropInventoryItem = dropInventoryItem;
    window.isDroppableInventoryItem = isDroppableInventoryItem;
}
