// Every item the player gains gets one inventory toast: an NPC's ink give_item and a
// give_item action (flag reward, triggerOnInteract) used to show only a line inside their
// own panel (m03 confirm run: Ffion's Visitor Badge). Booleans only: no DOM-like asserts.
// Run with: node test/js/item-gain-toast.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const read = (rel) => readFileSync(join(js, rel), 'utf8');

globalThis.window = {
    gameState: { globalVariables: {} },
    lockRef: (item) => item?.opens_lock,
    eventDispatcher: { on() {}, off() {}, emit() {} }
};
const N = await import(dataUrl(read('systems/notifications.js')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
    .split("'../utils/overlay-open.js'").join(`'${dataUrl(read('utils/overlay-open.js'))}'`)));
const { applyActions } = await import(dataUrl(read('systems/apply-actions.js')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../utils/escape-html.js'").join(`'${dataUrl('export const escapeHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'../utils/author-html.js'").join(`'${dataUrl('export const authorHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal() {}')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact() {} export function readyToastText() { return ""; } export function readyToastTitle() { return ""; }')}'`)));
const { NPCGameBridge } = await import('../../public/break_escape/js/systems/npc-game-bridge.js');

const quietly = async (fn) => {
    const log = console.log; console.log = () => {};
    const err = console.error; console.error = () => {};
    try { return await fn(); } finally { console.log = log; console.error = err; }
};
const tick = () => new Promise((r) => setTimeout(r, 5));

test('itemGainToast: a success toast naming the item; notes have their own toast', () => {
    const t = N.itemGainToast({ type: 'id_badge', name: 'Visitor Badge' });
    assert.ok(t.message === 'Received: Visitor Badge', 'message');
    assert.ok(t.type === 'success' && t.title === 'Item Acquired', 'type and title');
    assert.ok(N.itemGainToast({ type: 'notes2', name: 'Memo' }) === null, 'notes: null');
    assert.ok(N.itemGainToast(null) === null, 'nothing: null');
});

test('announceItemGain: only a new slot is announced, once', () => {
    const seen = [];
    const alert = (...a) => seen.push(a);
    const item = { type: 'key', name: 'Cabinet key' };
    assert.ok(N.announceItemGain(item, { ok: true, reason: 'added' }, alert) === true, 'added');
    assert.ok(N.announceItemGain(item, { ok: true, reason: 'already' }, alert) === false, 'already');
    assert.ok(N.announceItemGain(item, { ok: false, reason: 'rejected' }, alert) === false, 'rejected');
    assert.ok(N.announceItemGain(item, undefined, alert) === false, 'no result');
    assert.ok(seen.length === 1 && seen[0][0] === 'Received: Cabinet key', 'one toast');
});

test('give_item action (flag reward) raises the toast when the slot exists', async () => {
    const seen = [];
    window.announceItemGain = (item, res) => seen.push([item.name, res.reason]);
    window.addToInventory = () => Promise.resolve({ ok: true, reason: 'added' });
    await quietly(async () => { applyActions([{ type: 'give_item', item: { type: 'key', name: 'Reward key' } }]); await tick(); });
    assert.ok(seen.length === 1 && seen[0][0] === 'Reward key' && seen[0][1] === 'added', 'announced once');
});

test('NPC ink give_item (bridge) raises the toast, and a refusal does not', async () => {
    const seen = [];
    window.announceItemGain = (item, res) => seen.push(item.name);
    window.gameAlert = () => {};
    window.eventDispatcher = { emit() {} };
    const held = () => [{ type: 'id_badge', name: 'Visitor Badge' }];
    const npc = { id: 'ffion', itemsHeld: held() };
    window.npcManager = { getNPC: () => npc };
    window.addToInventory = () => Promise.resolve({ ok: true, reason: 'added' });
    const bridge = new NPCGameBridge();
    const r = await quietly(() => bridge.giveItem('ffion', 'id_badge'));
    assert.ok(r.success === true && seen.length === 1 && seen[0] === 'Visitor Badge', 'announced on give');
    npc.itemsHeld = held();
    window.addToInventory = () => Promise.resolve({ ok: false, reason: 'rejected' });
    await quietly(() => bridge.giveItem('ffion', 'id_badge'));
    assert.ok(seen.length === 1, 'no toast for a refused give');
});
