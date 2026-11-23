// Ops core step 9 (S3): the `technique_card` item type (OPS_CORE_PLAN.md 4.3, 11.3).
// A card's `type` is its own, so it gets a tray slot and the generic pickup toast; the paper types
// (notes, notes1, ...) get neither, which is why the card is not typed `notes1`. The three arrivals
// (a room object, a container take, an NPC gift) all go through addToInventory then announcePickup
// (interactions.js, container take, npc-game-bridge.js:283-305); the card loads from game.js.
// Run with: node test/js/technique-card-item.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'technique-card-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
const stub = (out, code) => { writeFileSync(join(dir, out), code); };
const copy = (src, out, rewrites = []) => {
    let code = readFileSync(join(js, src), 'utf8');
    for (const [a, b] of rewrites) code = code.replace(a, b);
    writeFileSync(join(dir, out), code);
    return pathToFileURL(join(dir, out)).href;
};

const dom = new JSDOM('<!doctype html><div id="inventory-container"></div>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;

stub('rooms-stub.mjs', 'export const rooms = {};');
stub('ink-stub.mjs', 'export default class InkEngine {}');
stub('config-stub.mjs', "export const CSRF_TOKEN = 'x';");
stub('info-label-stub.mjs', 'export function setHudLabel() {} export function clearHudLabel() {}');
copy('systems/forced-minigame-guard.js', 'forced-minigame-guard.mjs');
copy('systems/consumables.js', 'consumables.mjs');
const inv = await import(copy('systems/inventory.js', 'inventory.mjs', [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
    ["'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'"],
    ["'./consumables.js'", "'./consumables.mjs'"],
]));

let toasts = [];
function resetInventory() {
    toasts = [];
    document.getElementById('inventory-container').innerHTML = '';
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 77 };
    globalThis.fetch = async () => ({ json: async () => ({ success: true }) });
    window.lockRef = (item) => item?.opens_lock || item?.key_id || null;
    window.gameState = { notes: [], globalVariables: {} };
    window.addNote = () => null;
    window.gameAlert = (...a) => toasts.push(a);
    window.eventDispatcher = { emit() {} };
}
const slots = () => document.querySelectorAll('#inventory-container .inventory-slot').length;
const card = (id = 'card_factory') => ({
    id, type: 'technique_card', name: 'Field note: factory accounts', technique_card: 'factory_accounts', takeable: true
});
const sprite = (data, objectId) => ({ objectId: objectId || data.id, name: data.type, scenarioData: data, setVisible() {} });

test('pickupToast: a technique_card gets the generic toast; notes and notes1 get none', () => {
    assert.deepEqual(inv.pickupToast(card()),
        { message: 'Picked up Field note: factory accounts', type: 'info', title: '', duration: 2500 });
    assert.equal(inv.pickupToast({ type: 'notes1', name: 'Memo' }), null);
    assert.equal(inv.pickupToast({ type: 'notes', name: 'Memo' }), null);
});

for (const [label, objectId] of [
    ['a room object', 'card_factory'],
    ['a container take', 'card_factory'],
    ['an NPC gift (a temporary sprite)', 'npc_gift_card_factory']
]) {
    test(`${label}: a technique_card gets a tray slot and one pickup toast`, async () => {
        resetInventory();
        const s = sprite(card(), objectId);
        const res = await inv.addToInventory(s);
        assert.deepEqual(res, { ok: true, reason: 'added' });
        assert.equal(slots(), 1, 'a slot was made');
        assert.equal(window.inventory.items.length, 1);
        assert.equal(window.inventory.items[0].scenarioData.technique_card, 'factory_accounts');
        assert.equal(inv.announcePickup(s, res), true);
        assert.deepEqual(toasts, [['Picked up Field note: factory accounts', 'info', '', 2500]]);
    });
}

test('a notes1 item in the same flow gets no slot and no toast (why the card has its own type)', async () => {
    resetInventory();
    const note = { id: 'memo_1', type: 'notes1', name: 'Memo', takeable: true };
    const s = sprite(note);
    const res = await inv.addToInventory(s);
    assert.deepEqual(res, { ok: true, reason: 'added' });
    assert.equal(slots(), 0, 'paper types get no tray slot');
    assert.equal(window.inventory.items.length, 0);
    assert.equal(inv.announcePickup(s, res), false);
    assert.deepEqual(toasts, []);
});

test('the art is a byte copy of qr_card.png and game.js loads it', () => {
    const objects = join(here, '../../public/break_escape/assets/objects');
    assert.ok(existsSync(join(objects, 'technique_card.png')));
    assert.ok(readFileSync(join(objects, 'technique_card.png')).equals(readFileSync(join(objects, 'qr_card.png'))));
    const game = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(game, /this\.load\.image\('technique_card', 'objects\/technique_card\.png'\);/);
});
