// apply-actions.js remove_item: the counterpart to give_item — removes a named item
// (by type / id / name, or an array of them) from the player inventory and syncs the
// removal to the server. Its purpose is to sit inside a confirm_action's onConfirm so
// a required-but-not-consumed item (interactions.js requiresItem with NO consumesItem)
// is only taken once the player COMMITS to the dialog; cancelling keeps it. The
// physical-pentest lab plants kit_dropbox on network_port this way.
// Run with: bin/test-js test/js/remove-item-action.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'remove-item-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'systems'), { recursive: true });

function dataUrl(src) { return 'data:text/javascript,' + encodeURIComponent(src); }

// apply-actions.js with its STATIC imports stubbed; remove_item uses none of them.
const actionsSrc = readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal(){}')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact(){return{granted:false};} export function readyToastText(){return "";} export function readyToastTitle(){return "";}')}'`);
writeFileSync(join(dir, 'systems', 'apply-actions.mjs'), actionsSrc);

// Fake inventory + removeFromInventory + a fetch recorder for the server sync.
const fetchCalls = [];
function freshWindow(items) {
    globalThis.window = {
        gameState: { globalVariables: {} },
        breakEscapeConfig: { gameId: 42 },
        inventory: { items },
        removeFromInventory(it) {
            const i = this.inventory.items.indexOf(it);
            if (i >= 0) this.inventory.items.splice(i, 1);
        }
    };
    globalThis.document = { querySelector: () => ({ content: 'csrf-tok' }) };
    globalThis.fetch = (url, opts) => { fetchCalls.push({ url, opts }); return Promise.resolve({ ok: true }); };
}
function mkItem(scenarioData) { return { scenarioData }; }

// apply-actions.js assigns window.* at import time, so window must exist first.
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { querySelector: () => null };
const { applyActions } = await import(pathToFileURL(join(dir, 'systems', 'apply-actions.mjs')).href);

test('remove_item removes a held item matched by id and syncs the server removal', () => {
    fetchCalls.length = 0;
    freshWindow([mkItem({ id: 'kit_dropbox', type: 'dropbox', name: 'Network drop box' })]);
    applyActions([{ type: 'remove_item', item: 'kit_dropbox' }]);
    assert.equal(window.inventory.items.length, 0, 'item removed from inventory');
    assert.equal(fetchCalls.length, 1, 'one server sync call');
    const { url, opts } = fetchCalls[0];
    assert.match(url, /\/break_escape\/games\/42\/inventory$/);
    const body = JSON.parse(opts.body);
    assert.equal(body.action_type, 'remove');
    assert.equal(body.item.id, 'kit_dropbox');
});

test('remove_item also matches by type and by name', () => {
    freshWindow([mkItem({ id: 'kit_dropbox', type: 'dropbox', name: 'Network drop box' })]);
    applyActions([{ type: 'remove_item', item: 'dropbox' }]);  // by type
    assert.equal(window.inventory.items.length, 0);

    freshWindow([mkItem({ id: 'kit_dropbox', type: 'dropbox', name: 'Network drop box' })]);
    applyActions([{ type: 'remove_item', item: 'Network drop box' }]);  // by name
    assert.equal(window.inventory.items.length, 0);
});

test('remove_item accepts an array of candidate names (first held wins)', () => {
    freshWindow([mkItem({ id: 'kit_dropbox' })]);
    applyActions([{ type: 'remove_item', item: ['nope', 'kit_dropbox'] }]);
    assert.equal(window.inventory.items.length, 0);
});

test('remove_item is a no-op (no removal, no server call) when the item is not held', () => {
    fetchCalls.length = 0;
    freshWindow([mkItem({ id: 'kit_hivis' })]);
    applyActions([{ type: 'remove_item', item: 'kit_dropbox' }]);
    assert.equal(window.inventory.items.length, 1, 'untouched');
    assert.equal(fetchCalls.length, 0, 'no server sync');
});

test('remove_item only removes the matched item, leaving the rest of the inventory', () => {
    freshWindow([mkItem({ id: 'kit_hivis' }), mkItem({ id: 'kit_dropbox' }), mkItem({ id: 'kit_lockpick' })]);
    applyActions([{ type: 'remove_item', item: 'kit_dropbox' }]);
    assert.deepEqual(window.inventory.items.map(i => i.scenarioData.id), ['kit_hivis', 'kit_lockpick']);
});

test('confirm_action onConfirm with remove_item: cancel keeps the item, confirm removes it', async () => {
    // Cancel: gameConfirm resolves false -> onConfirm (with remove_item) never runs.
    freshWindow([mkItem({ id: 'kit_dropbox' })]);
    window.gameConfirm = () => Promise.resolve(false);
    applyActions([{ type: 'confirm_action', text: 'Plant it?', onConfirm: [
        { type: 'remove_item', item: 'kit_dropbox' }
    ] }]);
    await new Promise(r => setTimeout(r, 0));
    assert.equal(window.inventory.items.length, 1, 'cancel keeps the kit');

    // Confirm: gameConfirm resolves true -> onConfirm runs -> item removed.
    freshWindow([mkItem({ id: 'kit_dropbox' })]);
    window.gameConfirm = () => Promise.resolve(true);
    applyActions([{ type: 'confirm_action', text: 'Plant it?', onConfirm: [
        { type: 'remove_item', item: 'kit_dropbox' }
    ] }]);
    await new Promise(r => setTimeout(r, 0));
    assert.equal(window.inventory.items.length, 0, 'confirm removes the kit');
});

// Capture proofs (engine plan section 6): run from an object, remove_item names the object
// as used_on so the server can record the plant; from a timer it names none.
const lastBody = () => JSON.parse(fetchCalls[fetchCalls.length - 1].opts.body);

test('remove_item from an object trigger sends used_on', () => {
    fetchCalls.length = 0;
    freshWindow([mkItem({ id: 'kit_dropbox' })]);
    applyActions([{ type: 'remove_item', item: 'kit_dropbox' }], { source: 'object_interact', objectId: 'network_port' });
    assert.equal(lastBody().used_on, 'network_port');
});

test('remove_item through a confirm_action passes the object on to onConfirm', async () => {
    fetchCalls.length = 0;
    freshWindow([mkItem({ id: 'kit_dropbox' })]);
    window.gameConfirm = () => Promise.resolve(true);
    applyActions([{ type: 'confirm_action', text: 'Plant it?', onConfirm: [{ type: 'remove_item', item: 'kit_dropbox' }] }],
        { source: 'object_interact', objectId: 'network_port' });
    await new Promise(r => setTimeout(r, 0));
    assert.equal(lastBody().used_on, 'network_port');
});

test('remove_item from a timer sends no used_on', () => {
    fetchCalls.length = 0;
    freshWindow([mkItem({ id: 'kit_dropbox' })]);
    applyActions([{ type: 'remove_item', item: 'kit_dropbox' }], { source: 'timer' });
    assert.equal('used_on' in lastBody(), false);
});

test('the remove is retried once on a 5xx or a network error, and not on a refusal', async () => {
    const { sendInventoryRemove } = await import(pathToFileURL(join(dir, 'systems', 'apply-actions.mjs')).href);
    freshWindow([]);
    let calls = 0;
    globalThis.fetch = () => { calls++; return Promise.resolve({ ok: calls > 1, status: calls > 1 ? 200 : 503 }); };
    assert.equal(await sendInventoryRemove('kit_x', { usedOn: 'desk' }), true);
    assert.equal(calls, 2);
    calls = 0;
    globalThis.fetch = () => { calls++; return Promise.resolve({ ok: false, status: 422 }); };
    assert.equal(await sendInventoryRemove('kit_x', { usedOn: 'desk' }), false);
    assert.equal(calls, 1);
    calls = 0;
    globalThis.fetch = () => { calls++; return calls > 1 ? Promise.resolve({ ok: true }) : Promise.reject(new Error('offline')); };
    assert.equal(await sendInventoryRemove('kit_x'), true);
    assert.equal(calls, 2);
});
