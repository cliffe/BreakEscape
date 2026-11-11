/**
 * Wearable items (docs/achitechture/WEARABLE_BUILD_LOG.md).
 *
 * An item with a `wearable` object is put on and taken off from the tray:
 *
 *   "wearable": { "costume": "<scenario.disguises key>", "global": "<worn global>",
 *                 "unseenOnly": true, "seenBy": { "ignore": ["<npc id>"] },
 *                 "confirmOn": "...", "confirmOff": "...", "onWear": [...], "onRemove": [...] }
 *
 * The server owns whether it is worn (POST wear): it checks the item is held and wearable,
 * keeps one item worn at a time and writes the worn global and pp_disguise itself; a sync
 * cannot write a worn global. Here the client asks, and on a yes dresses the avatar
 * (costume-actions.js), writes the same globals locally (so mappings and gates see them at
 * once) and redraws the tray, where the worn item gets a frame and a "(worn)" label.
 *
 * unseenOnly refuses a change while anyone in the room can see: a `person` NPC in the
 * player's current room, visible, not knocked out, not in seenBy.ignore (the rule the
 * sight challenge uses for "in the room", without its line of sight test). The player is
 * told who is watching. A worn item that leaves the inventory comes off whatever the rule
 * says; a drop is a change, so the tray refuses it under unseenOnly.
 *
 * Reached through window.wearables (core/game.js loads it), so the modules that call it
 * (inventory.js, interactions.js, inventory-menu.js, apply-actions.js) need no import.
 * Test seams: every exported function takes a `deps` object (window, post, costume,
 * write, confirm, alert, applyActions).
 */

export const WORN_CLASS = 'tray-worn';
export const WORN_LABEL = '(worn)';

const win = () => (typeof window !== 'undefined' ? window : {});
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

/** The normalised `wearable` of an item's data, or null when it has no usable one. */
export function wearableSpec(data) {
    const raw = data?.wearable;
    if (!raw || typeof raw !== 'object' || !isStr(raw.costume) || !isStr(raw.global)) return null;
    const ignore = Array.isArray(raw.seenBy?.ignore) ? raw.seenBy.ignore.filter(isStr) : [];
    return {
        costume: raw.costume,
        global: raw.global,
        unseenOnly: raw.unseenOnly === true,
        ignore,
        confirmOn: isStr(raw.confirmOn) ? raw.confirmOn : null,
        confirmOff: isStr(raw.confirmOff) ? raw.confirmOff : null,
        onWear: Array.isArray(raw.onWear) ? raw.onWear : [],
        onRemove: Array.isArray(raw.onRemove) ? raw.onRemove : []
    };
}

/** The id of the item worn now, or null. */
export function wornItemId(w = win()) {
    const id = w.gameState?.wornItem?.itemId;
    return isStr(id) ? id : null;
}

/** True when this tray item (or item data) is the one worn. */
export function isWorn(itemOrData, w = win()) {
    const data = itemOrData?.scenarioData || itemOrData;
    const id = wornItemId(w);
    return !!id && data?.id === id;
}

/** The held tray item with this id, or null. */
export function heldItem(itemId, w = win()) {
    if (!isStr(itemId)) return null;
    return (w.inventory?.items || []).find(it => it?.scenarioData?.id === itemId) || null;
}

/**
 * Who can see a change, under the spec's unseenOnly: [{ id, name }], empty when the rule is off,
 * the player is between rooms, or nobody counts.
 */
export function watchersInRoom(spec, w = win()) {
    if (!spec?.unseenOnly) return [];
    const room = w.currentPlayerRoom;
    if (!isStr(room)) return [];
    const npcs = w.npcManager?.npcs;
    const list = npcs instanceof Map ? [...npcs.values()] : Array.isArray(npcs) ? npcs : Object.values(npcs || {});
    return list
        .filter(npc => npc && npc.npcType === 'person' && npc.roomId === room
            && npc.isVisible !== false
            && !spec.ignore.includes(npc.id)
            && w.npcHostileSystem?.isNPCKO?.(npc.id) !== true)
        .map(npc => ({ id: npc.id, name: isStr(npc.displayName) ? npc.displayName : 'someone' }));
}

/** The toast for a refused change: who is watching. */
export function refusalText(watchers, change = 'change') {
    // At most two names, so a full room stays one short line
    const names = watchers.map(n => n.name);
    const who = names.length <= 1 ? (names[0] || 'someone')
        : names.length === 2 ? `${names[0]} and ${names[1]}`
            : `${names[0]} and ${names.length - 1} others`;
    const verb = names.length > 1 ? 'are' : 'is';
    return `Not here: ${who} ${verb} watching. ${change === 'drop' ? 'Drop it' : 'Change'} somewhere out of sight.`;
}

/** Why a change to this item would be refused here, or null when it may go ahead. */
export function changeRefusal(data, change = 'change', w = win()) {
    const spec = wearableSpec(data);
    if (!spec) return null;
    const watchers = watchersInRoom(spec, w);
    return watchers.length ? refusalText(watchers, change) : null;
}

// Every text this module shows (watcher names, the item name, the server's message, confirmOn
// and confirmOff) is author or server text: shown as plain text, never as markup.
const PLAIN = { plainText: true };

function defaults(deps = {}) {
    const w = deps.window ?? win();
    return {
        w,
        post: deps.post ?? ((body) => w.ApiClient.post('/wear', body)),
        costume: deps.costume ?? (() => import('./costume-actions.js')),
        write: deps.write ?? (async (k, v) => {
            const { writeGlobal } = await import('./global-writer.js');
            writeGlobal(k, v, { emitAlways: false, openChat: false });
        }),
        confirm: deps.confirm ?? ((text) => (w.gameConfirm ? w.gameConfirm(text, 'Confirm', 'Cancel', PLAIN) : Promise.resolve(true))),
        alert: deps.alert ?? ((msg, title) => w.gameAlert?.(msg, 'warning', title || '', 4000, PLAIN)),
        applyActions: deps.applyActions ?? ((acts) => w.applyActions?.(acts, { source: 'wearable' })),
        refresh: deps.refresh ?? (() => w.refreshInventoryTray?.())
    };
}

// One change at a time, per window: a second click while a post is out is dropped, and a
// forced take-off (the item left the inventory) waits for the change in flight.
const inFlight = new WeakMap();

async function exclusive(w, force, fn) {
    const key = typeof w === 'object' && w ? w : globalThis;
    const current = inFlight.get(key);
    if (current) {
        if (!force) return false;
        await current.catch(() => {});
    }
    const run = Promise.resolve().then(fn);
    inFlight.set(key, run);
    try {
        return await run;
    } finally {
        if (inFlight.get(key) === run) inFlight.delete(key);
    }
}

// Apply what the server wrote: the costume first, then the worn record and the globals.
// Returns false, writing nothing, when the costume would not go on (the caller undoes).
async function settle(body, d, { costumeId }) {
    const mod = await d.costume();
    if (costumeId) {
        if ((await mod.setCostume(costumeId)) === false) return false;
    } else {
        await mod.clearCostume();
    }
    d.w.gameState = d.w.gameState || {};
    d.w.gameState.wornItem = body?.worn && isStr(body.worn.itemId) ? body.worn : null;
    await writeGlobals(body?.globals, d);
    d.refresh();
    return true;
}

// pp_disguise is written by the costume module itself; the rest here
async function writeGlobals(globals, d, skip = []) {
    const all = globals && typeof globals === 'object' ? globals : {};
    for (const [k, v] of Object.entries(all)) {
        if (k !== 'pp_disguise' && !skip.includes(k)) await d.write(k, v);
    }
}

// The refusal for changing this item (and the one worn now, which comes off) here, or null
function swapRefusal(data, prevData, w) {
    return changeRefusal(data, 'change', w) || (prevData ? changeRefusal(prevData, 'change', w) : null);
}

/**
 * Put a held wearable on. opts.confirm shows the item's confirmOn first; opts.force skips the
 * unseenOnly check. Returns true when it was put on.
 */
export async function putOn(itemId, opts = {}, deps = {}) {
    const d = defaults(deps);
    return exclusive(d.w, false, () => putOnNow(itemId, opts, d));
}

async function putOnNow(itemId, opts, d) {
    let item = heldItem(itemId, d.w);
    // From an action right after a give_item: the tray may not hold it yet
    for (let i = 0; !item && opts.waitMs > 0 && i < opts.waitMs / 100; i++) {
        await new Promise(r => setTimeout(r, 100));
        item = heldItem(itemId, d.w);
    }
    const spec = wearableSpec(item?.scenarioData);
    if (!item || !spec) {
        console.warn('[wearables] put on: not a held wearable:', itemId);
        return false;
    }
    if (isWorn(item, d.w)) return true;
    // Something else worn comes off first (the server does the same): its onRemove runs, and
    // under its own unseenOnly that is a change in front of anyone watching too
    const prevId = wornItemId(d.w);
    const prevData = prevId && prevId !== itemId ? heldItem(prevId, d.w)?.scenarioData || null : null;
    const prevSpec = wearableSpec(prevData);
    const refused = () => {
        if (opts.force) return false;
        const refusal = swapRefusal(item.scenarioData, prevData, d.w);
        if (!refusal) return false;
        d.alert(refusal, item.scenarioData.name);
        emit(d.w, 'wearable_refused', item, spec);
        return true;
    };
    if (refused()) return false;
    if (opts.confirm && spec.confirmOn) {
        if (!(await d.confirm(spec.confirmOn))) return false;
        // Someone may have walked in while the confirm was up
        if (refused()) return false;
    }
    let body;
    try {
        body = await d.post({ item_id: itemId, worn: true });
    } catch (err) {
        console.warn('[wearables] the server refused put on:', err?.body?.message || err?.message);
        d.alert(err?.body?.message || 'That cannot be put on now.', item.scenarioData.name);
        return false;
    }
    if (!body?.success) return false;
    if (!(await settle(body, d, { costumeId: spec.costume }))) {
        // The costume would not go on (no such disguise, sprite not loaded): take it off again
        // so the record, the global and the avatar agree
        console.warn('[wearables] the costume did not apply, taking the item off again:', spec.costume);
        await writeGlobals(body.globals, d, [spec.global]);
        let undo;
        try { undo = await d.post({ item_id: itemId, worn: false }); } catch (err) {
            console.warn('[wearables] undo failed:', err?.body?.message || err?.message);
        }
        const fallback = { success: true, worn: null, globals: { [spec.global]: false } };
        await settle(undo?.success ? withGlobal(undo, spec.global) : fallback, d, { costumeId: null });
        if (prevSpec) d.applyActions(prevSpec.onRemove);
        d.alert('That cannot be put on now.', item.scenarioData.name);
        return false;
    }
    if (prevSpec) d.applyActions(prevSpec.onRemove);
    d.applyActions(spec.onWear);
    emit(d.w, 'wearable_put_on', item, spec);
    return true;
}

// A take-off answer always clears the item's own global here, even when the server had no
// record to clear (an older game, or a drop the server already took off)
function withGlobal(body, global) {
    if (!global) return body;
    const globals = { ...(body?.globals && typeof body.globals === 'object' ? body.globals : {}) };
    if (!(global in globals)) globals[global] = false;
    return { ...body, globals };
}

/**
 * Take the worn item off (itemId, or whatever is worn when null). opts.confirm shows confirmOff
 * first; opts.force skips the unseenOnly check (an item that has left the inventory). Returns
 * true when something came off.
 */
export async function takeOff(itemId = null, opts = {}, deps = {}) {
    const d = defaults(deps);
    return exclusive(d.w, opts.force === true, () => takeOffNow(itemId, opts, d));
}

// A game from before wearables: no worn record, but a held wearable's global left true by the
// old client-written costume. That item counts as worn for taking off (the server clears it).
function strayWornId(itemId, w) {
    const vars = w.gameState?.globalVariables || {};
    const candidates = itemId ? [heldItem(itemId, w)] : (w.inventory?.items || []);
    const hit = candidates.find(it => {
        const spec = wearableSpec(it?.scenarioData);
        return spec && vars[spec.global] === true;
    });
    return hit ? hit.scenarioData.id : null;
}

async function takeOffNow(itemId, opts, d) {
    const wornId = wornItemId(d.w) || strayWornId(itemId, d.w);
    if (!wornId || (itemId && itemId !== wornId)) return false;
    const item = heldItem(wornId, d.w);
    const data = item?.scenarioData || opts.data || { id: wornId };
    const spec = wearableSpec(data);
    const refused = () => {
        if (opts.force || !item) return false;
        const refusal = changeRefusal(data, 'change', d.w);
        if (!refusal) return false;
        d.alert(refusal, data.name);
        emit(d.w, 'wearable_refused', item, spec);
        return true;
    };
    if (refused()) return false;
    if (opts.confirm && spec?.confirmOff) {
        if (!(await d.confirm(spec.confirmOff))) return false;
        if (refused()) return false;
    }
    let body;
    try {
        body = await d.post({ item_id: wornId, worn: false });
    } catch (err) {
        console.warn('[wearables] the server refused take off:', err?.body?.message || err?.message);
        // Gone from the inventory and the server has already taken it off: settle locally
        if (!opts.force) {
            d.alert(err?.body?.message || 'That cannot be taken off now.', data.name);
            return false;
        }
        body = { success: true, worn: null, globals: {} };
    }
    if (!body?.success) return false;
    await settle(withGlobal(body, spec?.global), d, { costumeId: null });
    if (spec) d.applyActions(spec.onRemove);
    emit(d.w, 'wearable_taken_off', item || { scenarioData: data }, spec);
    return true;
}

/** The tray click on a wearable: take it off when worn, else put it on, with its confirm. */
export async function toggle(sprite, deps = {}) {
    const id = sprite?.scenarioData?.id;
    if (!id) return false;
    return isWorn(sprite, deps.window ?? win())
        ? takeOff(id, { confirm: true }, deps)
        : putOn(id, { confirm: true }, deps);
}

/** removeFromInventory calls this: a worn item that leaves the tray comes off, unrefused. */
export function onItemLeft(item, deps = {}) {
    const w = deps.window ?? win();
    if (!isWorn(item, w)) return null;
    return takeOff(item.scenarioData.id, { force: true, data: item.scenarioData }, deps);
}

/** The tray menu's label for a wearable, or null for any other item. */
export function menuLabel(data, w = win()) {
    if (!wearableSpec(data)) return null;
    return isWorn(data, w) ? 'Take off' : 'Put on';
}

/** Draw or clear the worn frame and label on a tray item's slot. */
export function decorateSlot(item, w = win()) {
    const slot = item?.parentElement;
    if (!slot?.classList) return;
    const worn = isWorn(item, w);
    slot.classList.toggle(WORN_CLASS, worn);
    let label = slot.querySelector?.(':scope > .tray-worn-label');
    if (worn && !label && typeof document !== 'undefined') {
        label = document.createElement('span');
        label.className = 'tray-worn-label';
        label.textContent = WORN_LABEL;
        slot.appendChild(label);
    } else if (!worn && label) {
        label.remove();
    }
}

function emit(w, name, item, spec) {
    w.eventDispatcher?.emit?.(name, { itemId: item?.scenarioData?.id || null, costume: spec?.costume || null, global: spec?.global || null });
}

if (typeof window !== 'undefined') {
    window.wearables = {
        wearableSpec, wornItemId, isWorn, watchersInRoom, changeRefusal, putOn, takeOff, toggle,
        onItemLeft, menuLabel, decorateSlot
    };
    // inventory.js refreshInventoryTray calls decorateSlot for every slot; this catches up a
    // tray drawn before the module loaded
    (window.inventory?.items || []).forEach(it => decorateSlot(it));
}
