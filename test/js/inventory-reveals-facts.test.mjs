// S7 unit 06: an item that carries revealsFacts grants each fact on the client as it enters the
// inventory (through window.applyActions, so inventory.js has no new static import). A reload's
// restore grants nothing new (the grant is flip-only).
// Run with: node test/js/inventory-reveals-facts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'inventory-reveals-facts-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
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
copy('systems/consumables.js', 'consumables.mjs');
const inventorySource = readFileSync(join(js, 'systems/inventory.js'), 'utf8');
const inventoryUrl = copy('systems/inventory.js', 'inventory.mjs', [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
    ["'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'"],
    ["'./consumables.js'", "'./consumables.mjs'"],
]);

const dom = new JSDOM('<!doctype html><div id="inventory-container"></div>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { initializeInventory, showServerItem } = await import(inventoryUrl);

let granted, toasts;
async function reset(known = new Set()) {
    granted = [];
    toasts = [];
    globalThis.fetch = async () => ({ json: async () => ({ success: true }) });
    window.breakEscapeConfig = { gameId: 77 };
    window.lockRef = item => item?.opens_lock || item?.key_id || null;
    window.gameState = { notes: [], globalVariables: {} };
    window.gameAlert = (...a) => toasts.push(a);
    window.eventDispatcher = { emit() {} };
    window.gameScenario = {};
    // flip-only, as social-intel.js's grantFact is: a repeat grant does nothing
    window.applyActions = (actions, opts) => {
        for (const a of actions) {
            if (a.type !== 'grant_fact' || known.has(a.fact)) continue;
            known.add(a.fact);
            granted.push({ fact: a.fact, source: opts?.source });
            toasts.push(['Noted', a.fact]);
        }
    };
    initializeInventory();
    for (let i = 0; i < 3; i++) await new Promise(r => setTimeout(r, 0));
    granted.length = 0;
    toasts.length = 0;
}
const settle = () => new Promise(r => setTimeout(r, 0));

const notes = { type: 'lockpick', id: 'dana_notes', name: 'Dana notes', takeable: true, revealsFacts: ['danaPet', 'danaStreet'] };
const plain = { type: 'lockpick', id: 'plain_notes', name: 'Plain notes', takeable: true };

test('inventory.js takes no new static import', () => {
    const imports = inventorySource.split('\n').filter(l => l.startsWith('import '));
    assert.equal(imports.length, 6);
    assert.ok(!imports.some(l => /apply-actions|social-intel/.test(l)));
});

test('an item with two facts grants both, once each', async () => {
    await reset();
    showServerItem({ ...notes });
    await settle();
    assert.deepEqual(granted.map(g => g.fact), ['danaPet', 'danaStreet']);
    assert.ok(granted.every(g => g.source === 'item'));
});

test('an item without the field grants nothing', async () => {
    await reset();
    showServerItem({ ...plain });
    await settle();
    assert.deepEqual(granted, []);
});

test('a duplicate id in revealsFacts grants once', async () => {
    await reset();
    showServerItem({ ...notes, id: 'dup_notes', revealsFacts: ['danaPet', 'danaPet'] });
    await settle();
    assert.deepEqual(granted.map(g => g.fact), ['danaPet']);
});

test('a reload (facts already in the saved globals) grants and toasts nothing new', async () => {
    await reset(new Set(['danaPet', 'danaStreet']));
    showServerItem({ ...notes }, { restored: true });
    await settle();
    assert.deepEqual(granted, []);
    assert.deepEqual(toasts, []);
});

test('no applyActions on the page: the add still succeeds', async () => {
    await reset();
    delete window.applyActions;
    assert.equal(showServerItem({ ...notes, id: 'late_notes' }), true);
});

test('a notes-family item (kept in the notepad, no tray slot) grants its facts too', async () => {
    await reset();
    showServerItem({ ...notes, type: 'notes', id: 'dana_real_notes' });
    await settle();
    assert.deepEqual(granted.map(g => g.fact), ['danaPet', 'danaStreet']);
});
