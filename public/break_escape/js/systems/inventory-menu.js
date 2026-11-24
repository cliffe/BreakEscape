/**
 * The inventory click menu (feedback plan, section 5).
 *
 * A click on a tray item does one thing, chosen by handleObjectInteraction
 * (interactions.js). An item with more than one thing to do instead opens a
 * small menu over the tray:
 *
 *   droppable wearable                 "Put on" or "Take off", "Drop here", "Examine"
 *   droppable, no triggerOnInteract    "Drop here", "Examine"
 *   droppable consumable (coffee, kit) "Eat" (or "Drink", "Use"), "Drop here", "Examine"
 *   droppable consumable that is an NPC magnet (pizza, cake): "Drop here", "Eat", "Examine"
 *   droppable and locked               "Unlock" first (it opens the lock: pad, then any second step), then the rest
 *   droppable with triggerOnInteract   "Use" (useLabel overrides the word), "Drop here", "Examine"
 *   wearable, not droppable, with text "Put on" or "Take off", "Examine"
 *   saved connection (keyring K3b)     "Connect", "Drop here" when droppable, "Examine";
 *                                      with nothing to read and not droppable, the click is Connect
 *   everything else                    no menu: the click does what it did before
 *
 * A wearable that is not droppable and has no observations has no menu: its click puts it
 * on or takes it off (wearables.js). Each entry has an icon (inventoryMenuIcon). A wearable's actions live here only (UX slice 4, q91):
 * a click in the world takes it, and the first take asks once whether to put it on now. A worn wearable under unseenOnly is not dropped while
 * someone in the room is watching.
 *
 * The two tests that decide this are the tests the interaction chain itself
 * makes for a held item, in the same order: hasTriggerOnInteract (its first
 * branch) and isDroppableInventoryItem (its second). interactions.js calls the
 * same two helpers, so the menu and the chain cannot disagree.
 *
 * The entries name actions; the tray (openInventoryItemMenu) maps them onto
 * the existing functions: "Use" is handleObjectInteraction (the trigger branch
 * runs first, as a click did), "Drop here" is dropInventoryItem (item-drop.js),
 * "Examine" is examineHeldItem (examine.js), "Unlock" is handleUnlock(item, 'item')
 * (never "Use": handleObjectInteraction drops a held droppable item).
 *
 * Only pure helpers and the menu overlay are imported, so this file can be
 * tested in node.
 */
import { isDroppableInventoryItem, dropInventoryItem, isMagnet } from './item-drop.js';
import { showInteractionMenu, menuIconsBase, openHandIcon } from '../ui/interaction-menu.js';
import { resolveObjectField } from '../utils/conditional-text.js';
import { consumableHealAmount, consumableKind } from './consumables.js';

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
    const ctxWindow = ctx.window ?? (typeof window !== 'undefined' ? window : {});
    const connect = connectMenuEntry(sprite, ctxWindow);
    if (connect) {
        const droppable = isDroppableInventoryItem(sprite, items);
        // Nothing to read and nothing else to do: the click is Connect (trayClickIsConnect)
        if (!droppable && !heldItemHasText(sprite, ctxWindow)) return null;
        const out = [connect];
        if (droppable) out.push(dropEntry(ctx));
        out.push({ id: 'examine', label: 'Examine' });
        return out;
    }
    const wearLabel = ctxWindow.wearables?.menuLabel?.(data, ctxWindow);
    if (!isDroppableInventoryItem(sprite, items)) {
        // A wearable that cannot be dropped (the lab's carried vest) still has two things
        // to do when it has something to read: put it on or take it off, and Examine
        // (UX slice 4 R1 m5). With nothing to read its click stays the one toggle. "Something
        // to read" is what Examine would show (heldItemHasText, UX slice 4 R2 m4).
        if (wearLabel && heldItemHasText(sprite, ctxWindow)) return [{ id: 'use', label: wearLabel }, { id: 'examine', label: 'Examine' }];
        return null;
    }

    const drop = dropEntry(ctx);
    const entries = [];
    // A locked droppable (a carried briefcase): its tray click is the menu, and no other entry reaches
    // the lock (handleObjectInteraction would drop it), so the first entry unlocks it (S8c R1-CLIENT1)
    if (data.locked === true) entries.push({ id: 'unlock', label: 'Unlock' });
    // A wearable's first entry puts it on or takes it off (wearables.js); "Use" maps to the
    // click, which interactions.js routes to the wearable before any triggerOnInteract
    if (wearLabel) {
        entries.push({ id: 'use', label: wearLabel });
    } else if (hasTriggerOnInteract(data)) {
        const useLabel = typeof data.useLabel === 'string' && data.useLabel.trim() ? data.useLabel.trim() : 'Use';
        entries.push({ id: 'use', label: useLabel });
    } else if (consumableHealAmount(data, { inInventory: true }) > 0) {
        // A droppable consumable gets the menu too, so eating it needs its own entry: "use"
        // reaches the consume branch of handleObjectInteraction (consumables.js)
        const kind = consumableKind(data);
        const eat = { id: 'use', label: kind === 'drink' ? 'Drink' : kind === 'food' ? 'Eat' : 'Use' };
        // A magnet (pizza, cake) lures NPCs when put down, so "Drop here" leads and a habitual
        // first-entry click does not spend it; the player can still eat it second.
        if (isMagnet(data)) entries.push(drop, eat, { id: 'examine', label: 'Examine' });
        else entries.push(eat, drop, { id: 'examine', label: 'Examine' });
        return entries;
    }
    entries.push(drop, { id: 'examine', label: 'Examine' });
    return entries;
}

function dropEntry(ctx) {
    const blocked = 'dropBlocked' in ctx ? ctx.dropBlocked : dropBlockedReason();
    return blocked
        ? { id: 'drop', label: 'Drop here', disabled: true, reason: blocked }
        : { id: 'drop', label: 'Drop here' };
}

export const CONNECTING_TEXT = 'Connecting...';

/**
 * The Connect entry for a held item that proves a saved connection (keyring K3b, plan 8.2), or
 * null. The item's own `credential` never reaches the client, so window.keyring matches the
 * item's id to a GET /keyring row's `heldItem`. While a Connect runs the entry is greyed.
 * (K3c: an assist invite gets Connect here too, once keyring.js lists its kind.)
 */
export function connectMenuEntry(sprite, w = typeof window !== 'undefined' ? window : {}) {
    const kr = w?.keyring;
    const entry = kr?.connectEntryFor?.(sprite?.scenarioData?.id);
    if (!entry) return null;
    if (kr.connecting) return { id: 'connect', label: 'Connect', disabled: true, reason: CONNECTING_TEXT };
    return { id: 'connect', label: 'Connect' };
}

/** A click on this tray item is Connect itself: a saved connection with no menu (nothing to read, not droppable). */
export function trayClickIsConnect(sprite, ctx = {}) {
    const w = ctx.window ?? (typeof window !== 'undefined' ? window : {});
    if (!connectMenuEntry(sprite, w)) return false;
    return inventoryMenuFor(sprite, ctx) === null;
}

/**
 * Whether Examine would show anything for a held item: its observations or text after their
 * conditional variants, the same fields examineTextFor (interactions.js) resolves. That
 * function is not imported, because interactions.js imports this file.
 */
export function heldItemHasText(sprite, w = typeof window !== 'undefined' ? window : {}) {
    const data = sprite?.scenarioData;
    if (!data) return false;
    const vars = w?.gameState?.globalVariables || {};
    const nonBlank = (v) => typeof v === 'string' && v.trim() !== '';
    return nonBlank(resolveObjectField(data, 'observations', sprite?.observations || null, vars)) ||
        nonBlank(resolveObjectField(data, 'text', null, vars));
}

// The menu draws icons in a 64px box (ui/interaction-menu.js)
const MENU_ICON_BOX = 64;

/**
 * The icon of one tray menu entry (UX slice 4 R1 m1): the item's own tray picture for the
 * entry that uses it (Put on, Take off, Use), and the shared menu icons for Drop here and
 * Examine. Drawn at a whole-number scale, so pixel art stays crisp. A picture larger than
 * the 64px box would need shrinking by a fraction, so it gets the shared open hand (the
 * world menu's "use this" icon) instead (UX slice 4 R2 m6). Undefined when there is
 * nothing to draw.
 */
export function inventoryMenuIcon(id, el) {
    if (id === 'drop') return { src: `${menuIconsBase()}/menu-drop.png`, width: 64, height: 64 };
    if (id === 'examine') return { src: `${menuIconsBase()}/menu-examine.png`, width: 64, height: 64 };
    // Connect (keyring K3b) shows the item's own picture, as Use does
    if ((id !== 'use' && id !== 'connect' && id !== 'unlock') || !el?.src) return undefined;
    const w = el.naturalWidth || 0;
    const h = el.naturalHeight || 0;
    if (!(w > 0 && h > 0)) return { src: el.src };
    const big = Math.max(w, h);
    if (big > MENU_ICON_BOX) return openHandIcon();
    const scale = Math.floor(MENU_ICON_BOX / big);
    return { src: el.src, width: Math.round(w * scale), height: Math.round(h * scale) };
}

/** The top centre of a tray item, for a menu opened with no pointer; undefined when it has no box. */
export function slotPoint(el) {
    const r = typeof el?.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
    if (!r || !(r.width > 0 || r.height > 0)) return { x: undefined, y: undefined };
    return { x: r.left + r.width / 2, y: r.top };
}

/**
 * The tray click: open the item's menu if it has one. Returns true when a menu
 * opened (the caller does nothing else), false when the caller should run the
 * click as before (handleObjectInteraction).
 *
 * Busy guard, as action-menu.js maybeShowObjectActionMenu has: never over a
 * minigame or chat, or over an already-open menu. An item with a menu then
 * does nothing (returns true): "Examine" would end the running minigame, and
 * the menu's number keys would take the chat's own. The tray is covered in
 * both states today, so this guards a script call or an uncovered tray.
 *
 * "Drop here" is checked again when it is chosen: the menu takes no movement
 * keys, so the player can walk into a doorway while it is up. A drop that is
 * no longer allowed shows its reason instead.
 */
export function openInventoryItemMenu(el, clientX, clientY, deps = {}) {
    const w = deps.window ?? (typeof window !== 'undefined' ? window : {});
    const busy = () => !!(w.MinigameFramework?.currentMinigame || w.isInteractionMenuOpen?.());
    // Keyring K3b: a saved connection with no menu connects on the click; a click while a
    // Connect runs does nothing (keyring.connect's own guard)
    if (trayClickIsConnect(el, deps.ctx || {})) {
        if (!busy()) w.keyring?.connect?.(el);
        return true;
    }
    const entries = inventoryMenuFor(el, deps.ctx || {});
    if (!entries) return false;
    if (busy()) return true;
    const blockedNow = deps.dropBlockedReason ?? (() => dropBlockedReason(w));
    const actions = {
        use: () => w.handleObjectInteraction?.(el),
        // A locked droppable: the pad and any second step, never the click (which would drop it)
        unlock: () => w.handleUnlock?.(el, 'item'),
        drop: () => {
            // A worn item under unseenOnly is not dropped in front of anyone (wearables.js)
            const reason = blockedNow() || (w.wearables?.isWorn?.(el, w) ? w.wearables.changeRefusal?.(el.scenarioData, 'drop', w) : null);
            if (reason) {
                // The reason can name watchers (author text): plain text, never markup
                w.gameAlert?.(reason, 'warning', 'Drop here', 3000, { plainText: true });
                return;
            }
            (deps.dropInventoryItem ?? dropInventoryItem)(el);
        },
        examine: () => w.examineHeldItem?.(el),
        // Keyring K3b (plan 8.2): the entry is greyed while one runs, and connect() ignores a second
        connect: () => w.keyring?.connect?.(el)
    };
    // A click with no pointer position (el.click(), a key on the focused item) reports
    // 0,0: place the menu over the item's slot instead of in the corner
    let x = clientX, y = clientY;
    if (!x && !y) ({ x, y } = slotPoint(el));
    // The game's own menu overlay (ui/interaction-menu.js), titled with the item's name,
    // with keys 1 to 9 picking an entry
    const show = deps.showInteractionMenu ?? showInteractionMenu;
    show(entries.map(e => ({
        icon: inventoryMenuIcon(e.id, el),
        label: e.label,
        detail: e.disabled ? e.reason : undefined,
        disabled: !!e.disabled,
        onSelect: () => actions[e.id]?.()
    })), x, y, el.scenarioData?.name || el.alt || 'Item', { numberKeys: true, holdKeys: !w.roomHasActiveHostile?.() });
    return true;
}

if (typeof window !== 'undefined') {
    window.openInventoryItemMenu = openInventoryItemMenu;
    window.inventoryMenuFor = inventoryMenuFor;
}
