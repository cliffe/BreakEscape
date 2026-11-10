/**
 * The inventory click menu (feedback plan, section 5).
 *
 * A click on a tray item does one thing, chosen by handleObjectInteraction
 * (interactions.js). An item with more than one thing to do instead opens a
 * small menu over the tray:
 *
 *   droppable, no triggerOnInteract    "Drop here", "Examine"
 *   droppable with triggerOnInteract   "Use" (useLabel overrides the word), "Drop here", "Examine"
 *   everything else                    no menu: the click does what it did before
 *
 * A carried item with triggerOnInteract that is not droppable (the lab's hi-vis vest,
 * which toggles the disguise in content) has no menu: its click is its trigger.
 *
 * The two tests that decide this are the tests the interaction chain itself
 * makes for a held item, in the same order: hasTriggerOnInteract (its first
 * branch) and isDroppableInventoryItem (its second). interactions.js calls the
 * same two helpers, so the menu and the chain cannot disagree.
 *
 * The entries name actions; the tray (openInventoryItemMenu) maps them onto
 * the existing functions: "Use" is handleObjectInteraction (the trigger branch
 * runs first, as a click did), "Drop here" is dropInventoryItem (item-drop.js),
 * "Examine" is examineHeldItem (examine.js).
 *
 * Only pure helpers and the menu overlay are imported, so this file can be
 * tested in node.
 */
import { isDroppableInventoryItem, dropInventoryItem } from './item-drop.js';
import { showInteractionMenu } from '../ui/interaction-menu.js';

// interactions.js takes the chain's drop test and the drop itself from here, so the
// menu and the chain read the same functions.
export { isDroppableInventoryItem, dropInventoryItem };

const TILE = 32;

/** The interaction chain's first test: the object fires scenario actions on a click. */
export function hasTriggerOnInteract(data) {
    return Array.isArray(data?.triggerOnInteract);
}

/**
 * Why "Drop here" cannot be used where the player stands, or null when it can.
 * Between rooms (no current room: updatePlayerRoom clears it in a doorway gap)
 * or with the player's feet on a door's footprint, a dropped item would land
 * in no room or in the doorway, so the entry is greyed with the reason.
 *
 * @param {object} w - the window (or a stand-in in tests)
 */
export function dropBlockedReason(w = (typeof window !== 'undefined' ? window : {})) {
    const roomId = w.currentPlayerRoom;
    const room = roomId ? w.rooms?.[roomId] : null;
    if (!room) return 'You are between rooms. Step into a room first.';
    const p = w.player;
    if (!p) return null;
    const fx = p.body?.center?.x ?? p.x;
    const fy = p.body ? (p.body.y + p.body.height) : p.y;
    if (!Number.isFinite(fx) || !Number.isFinite(fy)) return null;
    // A side doorway is two sprites, one in each room, so every room's doors are checked.
    const doors = Object.values(w.rooms || {}).flatMap(r => r?.doorSprites || []);
    for (const door of doors) {
        if (!door || door.destroyed || door.active === false || !Number.isFinite(door.x) || !Number.isFinite(door.y)) continue;
        const halfW = (door.displayWidth || TILE) / 2;
        const halfH = (door.displayHeight || TILE) / 2;
        if (fx >= door.x - halfW && fx <= door.x + halfW && fy >= door.y - halfH && fy <= door.y + halfH) {
            return 'You are in a doorway. Step into the room first.';
        }
    }
    return null;
}

/**
 * The menu for a tray item, or null for an item whose click keeps its one
 * behaviour. Each entry is { id, label } with, for a "Drop here" that cannot
 * be used here, `disabled: true` and a `reason`.
 *
 * @param {object} sprite - the tray element (its scenarioData is the item)
 * @param {object} [ctx]
 * @param {Array}  [ctx.inventoryItems] - window.inventory.items
 * @param {string|null} [ctx.dropBlocked] - dropBlockedReason(), worked out here when omitted
 */
export function inventoryMenuFor(sprite, ctx = {}) {
    const data = sprite?.scenarioData;
    if (!data) return null;

    const items = ctx.inventoryItems ?? (typeof window !== 'undefined' ? window.inventory?.items : undefined);
    if (!isDroppableInventoryItem(sprite, items)) return null;

    const blocked = 'dropBlocked' in ctx ? ctx.dropBlocked : dropBlockedReason();
    const drop = blocked
        ? { id: 'drop', label: 'Drop here', disabled: true, reason: blocked }
        : { id: 'drop', label: 'Drop here' };
    const entries = [];
    if (hasTriggerOnInteract(data)) {
        const useLabel = typeof data.useLabel === 'string' && data.useLabel.trim() ? data.useLabel.trim() : 'Use';
        entries.push({ id: 'use', label: useLabel });
    }
    entries.push(drop, { id: 'examine', label: 'Examine' });
    return entries;
}

/**
 * The tray click: open the item's menu if it has one. Returns true when a menu
 * opened (the caller does nothing else), false when the caller should run the
 * click as before (handleObjectInteraction).
 */
export function openInventoryItemMenu(el, clientX, clientY, deps = {}) {
    const w = deps.window ?? (typeof window !== 'undefined' ? window : {});
    const entries = inventoryMenuFor(el, deps.ctx || {});
    if (!entries) return false;
    const actions = {
        use: () => w.handleObjectInteraction?.(el),
        drop: () => (deps.dropInventoryItem ?? dropInventoryItem)(el),
        examine: () => w.examineHeldItem?.(el)
    };
    // The game's own menu overlay (ui/interaction-menu.js), titled with the item's name,
    // with keys 1 to 9 picking an entry
    const show = deps.showInteractionMenu ?? showInteractionMenu;
    show(entries.map(e => ({
        label: e.label,
        detail: e.disabled ? e.reason : undefined,
        disabled: !!e.disabled,
        onSelect: () => actions[e.id]?.()
    })), clientX, clientY, el.scenarioData?.name || el.alt || 'Item', { numberKeys: true });
    return true;
}

if (typeof window !== 'undefined') {
    window.openInventoryItemMenu = openInventoryItemMenu;
    window.inventoryMenuFor = inventoryMenuFor;
}
