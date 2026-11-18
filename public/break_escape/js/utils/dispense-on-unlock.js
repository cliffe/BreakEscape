// A container the scenario marks `"dispenses": true` (a badge printer, a vending slot) hands its
// contents over the moment the correct PIN or password opens it, instead of opening the container
// screen and waiting for a click on each item. Every item still goes through addToInventory, so the
// server validates the item against the scenario exactly as it does for a click in the container.
// The client grants nothing: the contents come from GET /container/<id>, which the server only
// answers once the unlock has been accepted, and which leaves out anything already collected.
import { takeStandIn } from '../minigames/container/container-item-image.js';
import { displayDashes } from './display-dashes.js';

// One hand-over at a time per object: a second call while the first is still talking to the server
// waits for it, so the badge is never added (or announced) twice. A WeakMap keeps the promise off
// the scenario data, which is sent to the server.
const inFlight = new WeakMap();
const NOTES_FAMILY = /^notes\d*$/;

// Default dependencies are loaded on first use so node tests can inject their own
async function defaultDeps() {
    const inv = await import('../systems/inventory.js');
    return {
        addToInventory: inv.addToInventory,
        imageKey: inv.inventoryImageKey,
        fetchFn: (...a) => fetch(...a),
    };
}

export function wantsDispense(data) {
    if (!data || data.dispenses !== true) return false;
    // A tray already emptied this session needs no further GET on every reopen
    if (Array.isArray(data.contents) && data.contents.length === 0) return false;
    return !!(data.contents || data.hasContents);
}

export function isDispensing(data) {
    return !!(data && typeof data === 'object' && inFlight.has(data));
}

/**
 * What happens after a locked container is unlocked: hand its contents over if it dispenses, and
 * open the container screen otherwise or when the hand-over fails. unlock-system.js stays a thin
 * caller of this.
 * @param {object} data - scenario data of the container
 * @param {{autoOpen?: boolean, openScreen: Function}} opts
 * @returns {Promise<'skipped'|'dispensed'|'screen'>}
 */
export async function afterContainerUnlock(data, { autoOpen = true, openScreen } = {}, deps = {}) {
    if (!autoOpen) return 'skipped';
    if (isDispensing(data)) return 'skipped';
    if (wantsDispense(data)) {
        const result = await dispenseContents(data, deps);
        if (result.ok) return 'dispensed';
    }
    if (openScreen) { openScreen(); return 'screen'; }
    return 'skipped';
}

/**
 * @param {object} data - the unlocked object's scenario data
 * @param {object} [deps] - { addToInventory, imageKey, fetchFn, gameId, alert, sound } for tests
 * @returns {Promise<{ok: boolean, taken: string[], failed: string[]}>} ok is false when nothing was
 *   handed over, and the caller then falls back to opening the container screen
 */
export function dispenseContents(data, deps = {}) {
    if (!data || typeof data !== 'object') return runDispense(data, deps);
    const running = inFlight.get(data);
    if (running) return running.then(() => ({ ok: true, taken: [], failed: [] }));
    const p = runDispense(data, deps).finally(() => inFlight.delete(data));
    inFlight.set(data, p);
    return p;
}

async function runDispense(data, deps) {
    const d = { ...(await (deps.addToInventory ? {} : defaultDeps())), ...deps };
    const alert = d.alert || ((msg, kind, title, ms) => window.gameAlert?.(msg, kind, title, ms));
    const sound = d.sound || ((name) => { try { window.playUISound?.(name); } catch (e) { /* no audio */ } });
    const gameId = d.gameId || window.gameId || window.breakEscapeConfig?.gameId;
    const out = { ok: false, taken: [], failed: [] };
    if (!gameId || !data) return out;

    let contents;
    try {
        const id = data.id || data.name;
        const res = await d.fetchFn(`/break_escape/games/${gameId}/container/${encodeURIComponent(id)}`, {
            headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) return out;
        contents = (await res.json()).contents || [];
    } catch (e) {
        return out;
    }

    // Anything that is not a plain takeable item (a note that opens a minigame, a fixture) needs the
    // container screen, so dispense nothing and let the caller open it
    if (contents.some(i => i && (i.takeable === false || NOTES_FAMILY.test(i.type || '')))) return out;
    const items = contents.filter(i => i);
    // Nothing left to hand over: clear any stale copy an earlier unlock reply wrote, so the
    // screen the caller opens says the tray is empty instead of offering a held item
    if (!items.length) { data.contents = []; return out; }
    const already = [];
    for (const item of items) {
        const res = await d.addToInventory(takeStandIn(item, d.imageKey));
        if (res && res.ok) {
            out.taken.push(item.id || item.name);
            if (res.reason === 'already') already.push(item.id || item.name);
        } else out.failed.push(item.id || item.name);
    }
    data.contents = contents.filter(i => !out.taken.includes(i.id || i.name));
    // An item the client already held counts as handed over, but gets no "added" toast
    const added = out.taken.filter(k => !already.includes(k));
    if (added.length) {
        sound('item');
        const names = items.filter(i => added.includes(i.id || i.name)).map(i => i.name).join(', ');
        alert(`${displayDashes(data.name)}: ${displayDashes(names)} added to inventory`, 'success', 'Printed', 3000);
    }
    if (out.failed.length) sound('reject');
    out.ok = out.failed.length === 0 && out.taken.length > 0;
    return out;
}
