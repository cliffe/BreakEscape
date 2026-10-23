// m10 F3: a reload toasted "Invalid Action: NPC not encountered: nightshade_lock".
// processInitialInventoryItems re-added every item the server already held through
// addToInventory, which POSTed each one as a fresh pickup with no source NPC. The
// server then re-validated Nightshade's payment (a notes gift) against the first NPC
// copy holding it in its room order, nightshade_lock in the gallery, whom the player
// had not met yet. Restored items now skip the server round trip: the server is
// where they came from. Live adds and NPC gives still validate.
// Run with: node --test test/js/inventory-restore-no-revalidate.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'inventory-restore-'));
const copy = (src, out, rewrites = []) => {
    let code = readFileSync(join(js, src), 'utf8');
    for (const [a, b] of rewrites) code = code.replace(a, b);
    writeFileSync(join(dir, out), code);
    return pathToFileURL(join(dir, out)).href;
};
const stub = (out, code) => { writeFileSync(join(dir, out), code); };

stub('rooms-stub.mjs', 'export const rooms = {};');
stub('ink-stub.mjs', 'export default class InkEngine {}');
stub('config-stub.mjs', "export const CSRF_TOKEN = 'x';");
stub('info-label-stub.mjs', 'export function setHudLabel() {} export function clearHudLabel() {}');
copy('systems/forced-minigame-guard.js', 'forced-minigame-guard.mjs');
const inventoryUrl = copy('systems/inventory.js', 'inventory.mjs', [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
    ["'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'"],
]);

globalThis.window = {};
globalThis.document = { getElementById: () => null, createElement: () => ({ style: {}, appendChild() {}, addEventListener() {} }) };
const { addToInventory, processInitialInventoryItems } = await import(inventoryUrl);

const posts = [];
function reset({ playerInventory } = {}) {
    posts.length = 0;
    globalThis.fetch = async (url, init) => {
        posts.push({ url, body: JSON.parse(init.body) });
        return { json: async () => ({ success: true }) };
    };
    Object.assign(window, {
        breakEscapeConfig: { gameId: 3813 },
        lockRef: item => item?.opens_lock || item?.key_id || null,
        inventory: { items: [], _initialItemsProcessed: false },
        gameState: { notes: [], globalVariables: {} },
        addNote: (title, text) => window.gameState.notes.push({ title, text }),
        gameScenario: { playerInventory },
    });
    delete window.gameAlert;
}

const payment = { type: 'notes', id: 'nightshade_payment', name: "Nightshade's Payment: The Defences", text: 'TOMB GAMMA.', takeable: true };
const tag = { type: 'notes', id: 'monitor_maintenance_tag', name: 'Maintenance Tag', text: 'Do not remove.', takeable: true };

test('reload: items restored from the server inventory are not POSTed back for revalidation', async () => {
    reset({ playerInventory: [payment, tag] });
    processInitialInventoryItems();
    await new Promise(r => setTimeout(r, 0));
    assert.deepEqual(posts, [], 'no inventory add request on restore');
    // the notes still reach the notepad (R10 m1 restore)
    assert.deepEqual(window.gameState.notes.map(n => n.title), [payment.name, tag.name]);
});

test('reload: a restored item is reported as held, so nothing treats it as refused', async () => {
    reset();
    const toasts = [];
    window.gameAlert = (...a) => toasts.push(a);
    const r = await addToInventory({ name: 'notes', objectId: 'inventory_notes_1', scenarioData: payment, _restoredFromSave: true });
    assert.equal(r.ok, true);
    assert.equal(posts.length, 0);
    assert.deepEqual(toasts, []);
});

test('a live pickup still validates with the server', async () => {
    reset();
    await addToInventory({ name: 'notes', objectId: 'gallery_notes_0', scenarioData: tag });
    assert.equal(posts.length, 1);
    assert.equal(posts[0].body.action_type, 'add');
    assert.equal(posts[0].body.item.id, 'monitor_maintenance_tag');
});

test('an NPC give still validates, naming the NPC that gave it', async () => {
    reset();
    await addToInventory({ name: 'notes', objectId: 'npc_gift_nightshade_table_notes_1', scenarioData: payment, sourceNpcId: 'nightshade_table' });
    assert.equal(posts.length, 1);
    assert.equal(posts[0].body.source_npc_id, 'nightshade_table');
});

test('a refused live add is still reported as refused', async () => {
    reset();
    globalThis.fetch = async (url, init) => {
        posts.push({ url, body: JSON.parse(init.body) });
        return { json: async () => ({ success: false, message: 'NPC not encountered: nightshade_lock' }) };
    };
    const r = await addToInventory({ name: 'notes', objectId: 'x', scenarioData: payment, sourceNpcId: 'nightshade_lock' });
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'rejected');
});
