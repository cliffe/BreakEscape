// A container the scenario marks `"dispenses": true` (a badge printer, a vending slot) hands its
// contents over the moment the correct PIN or password opens it, instead of opening the container
// screen and waiting for a click on each item. Every item still goes through addToInventory, so the
// server validates the item against the scenario exactly as it does for a click in the container.
// The client grants nothing: the contents come from GET /container/<id>, which the server only
// answers once the unlock has been accepted, and which leaves out anything already collected.
import { takeStandIn } from '../minigames/container/container-item-image.js';

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
    return !!(data && data.dispenses === true && (data.contents || data.hasContents));
}

/**
 * @param {object} data - the unlocked object's scenario data
 * @param {object} [deps] - { addToInventory, imageKey, fetchFn, gameId, alert, sound } for tests
 * @returns {Promise<{ok: boolean, taken: string[], failed: string[]}>} ok is false when nothing was
 *   handed over, and the caller then falls back to opening the container screen
 */
export async function dispenseContents(data, deps = {}) {
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

    const items = contents.filter(i => i && i.takeable !== false);
    if (!items.length) return out;
    for (const item of items) {
        const res = await d.addToInventory(takeStandIn(item, d.imageKey));
        if (res && res.ok) out.taken.push(item.id || item.name);
        else out.failed.push(item.id || item.name);
    }
    data.contents = contents.filter(i => !out.taken.includes(i.id || i.name));
    if (out.taken.length) {
        sound('item');
        const names = items.filter(i => out.taken.includes(i.id || i.name)).map(i => i.name).join(', ');
        alert(`${data.name}: ${names} added to inventory`, 'success', 'Printed', 3000);
    }
    if (out.failed.length) sound('reject');
    out.ok = out.failed.length === 0 && out.taken.length > 0;
    return out;
}
