// A gated item the player carries, clicked in the inventory: its pad, then the pane (S8c unit 27).
// The item is the one the real server sent on the NPC's held items (gordon_briefcase, PIN lock, push step
// owned by Gordon: test/js/fixtures/lock_step_room_payloads.json), put in the tray as an <img> carrying
// scenarioData the way inventory.js builds it. The briefcase is droppable, so a tray click opens its menu
// (inventory-menu.js) and never reaches interactions.js: the player picks "Unlock" in the real overlay
// (ui/interaction-menu.js), which calls handleUnlock(item, 'item'). The tray's click listener is the one in
// inventory.js: the tray <img> is built by the REAL addToInventory (a copy of inventory.js with only its
// four collaborators stubbed, as inventory-restore-no-revalidate.test.mjs does) and the test dispatches a real
// click on it, so the listener under test is inventory.js's own (forced-conversation guard, menu first).
// Real inventory-menu.js and overlay, unlock-system.js, starters, PIN pad, ApiClient.unlock, lock-step.js,
// pane and mfa-client.js; only the network is stubbed, from the shared answer fixture.
// Run with: bin/test-js test/js/lock-step-carried.test.mjs
import test from 'node:test';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { loadAnswer } from './helpers/lock-step-answers.mjs';
import { buildStack, makeNetwork, settle, quickTimers, bootPage, payloads, deep, js } from './helpers/lock-step-real-stack.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

// The real inventory.js, its imports rewritten to stand-ins (what it needs of them is not under test here)
const idir = mkdtempSync(join(tmpdir(), 'lock-step-carried-'));
writeFileSync(join(idir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(idir, 'rooms-stub.mjs'), 'export const rooms = {};');
writeFileSync(join(idir, 'ink-stub.mjs'), 'export default class InkEngine {}');
writeFileSync(join(idir, 'config-stub.mjs'), "export const CSRF_TOKEN = 'x';");
writeFileSync(join(idir, 'info-label-stub.mjs'), 'export function setHudLabel() {} export function clearHudLabel() {}');
writeFileSync(join(idir, 'guard-stub.mjs'), 'export function inventoryBlockedByForcedMinigame() { return false; }');
writeFileSync(join(idir, 'consumables-stub.mjs'), 'export function markObjectConsumed() {}');
let invSrc = readFileSync(join(js, 'systems/inventory.js'), 'utf8');
for (const [a, b] of [["'../core/rooms.js'", "'./rooms-stub.mjs'"], ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"], ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"], ["'./forced-minigame-guard.js'", "'./guard-stub.mjs'"], ["'./consumables.js'", "'./consumables-stub.mjs'"]]) {
    if (!invSrc.includes(a)) throw new Error(`inventory.js no longer imports ${a}`);
    invSrc = invSrc.split(a).join(b);
}
writeFileSync(join(idir, 'inventory.mjs'), invSrc);

const S = await buildStack();
const { addToInventory } = await import(pathToFileURL(join(idir, 'inventory.mjs')).href);
const net = makeNetwork();
quickTimers();

const gateForGordon = { name: 'gate_push', patch: (b) => { b.targetId = 'gordon_briefcase'; b.npcId = 'gordon'; } };
const openBriefcase = { name: 'open_object', patch: (b) => { b.contents = [{ id: 'board_minutes', type: 'notes', name: 'Board minutes', takeable: true }]; } };

function carried() {
    const data = deep(payloads.startRoom.npcs.find((n) => n.id === 'gordon').itemsHeld.find((i) => i.id === 'gordon_briefcase'));
    // inventory.js: the item is in the tray, so it is no longer takeable from the floor
    data.takeable = false;
    const img = document.createElement('img');
    img.scenarioData = data;
    img.objectId = 'inventory_gordon_briefcase';
    img.locked = data.locked;
    img.lockType = data.lockType;
    return img;
}
// The tray image the real addToInventory builds for the carried item (after bootPage: it clears the body)
async function inTray(fake) {
    const box = document.createElement('div');
    box.id = 'inventory-container';
    document.body.appendChild(box);
    const r = await addToInventory({ name: fake.scenarioData.id, objectId: fake.scenarioData.id, scenarioData: fake.scenarioData, _restoredFromSave: true });
    assert.equal(r.ok, true);
    const img = box.querySelector('img.inventory-item');
    assert.ok(img, 'addToInventory put the item in the tray');
    if (!window.inventory.items.includes(img)) window.inventory.items.push(img);
    return img;
}
// A real click on the tray image (inventory.js's own listener), then a click on the overlay's entry
function trayClick(item, label) {
    item.dispatchEvent(new window.Event('click', { bubbles: true, cancelable: true }));
    const rows = [...document.querySelectorAll('#be-interaction-menu .be-im-item')];
    const row = rows.find((r) => r.textContent.includes(label));
    assert.ok(row, `the tray menu has "${label}" (has: ${rows.map((r) => r.textContent.trim()).join(' | ')})`);
    row.click();
}
const pad = () => window.MinigameFramework.currentMinigame;
async function typePin() {
    for (const d of '1357') pad().handleNumberInput(d);
    await settle(20);
}
const paneState = () => window.__test.lockStep.state();

test('the carried item reads as gated: the payload has secondStep on it and the requirements carry it', () => {
    const item = carried();
    assert.deepEqual(item.scenarioData.secondStep, { kind: 'push', owner: 'gordon' });
    assert.deepEqual(S.unlockSystem.getLockRequirementsForItem(item).secondStep, { kind: 'push', owner: 'gordon' });
    assert.equal('contents' in item.scenarioData, false);
});

test('clicked in the tray: the pad opens on it, the pane opens over the pad, the owner approves, the item opens once', async () => {
    const fake = carried();
    const log = bootPage(S);
    const item = await inTray(fake);
    net.reset({ '/unlock': [gateForGordon, openBriefcase], '/mfa/prompt': ['prompt_passed'] });
    trayClick(item, 'Unlock');
    await settle();
    assert.equal(pad().constructor.name, 'PinMinigame');
    await typePin();
    await settle(20);
    const unlocks = net.posted('/unlock');
    assert.equal(unlocks.length, 2);
    assert.deepEqual(unlocks[0].body, { targetType: 'item', targetId: 'gordon_briefcase', attempt: '1357', method: 'pin' });
    assert.deepEqual(unlocks[1].body, unlocks[0].body);
    assert.deepEqual(net.posted('/mfa/prompt').map((p) => p.body), [{ target_type: 'object', target_id: 'gordon_briefcase' }]);
    assert.equal(window.MinigameFramework.ended.length, 1);
    assert.equal(window.MinigameFramework.ended[0].success, true);
    assert.equal(item.scenarioData.locked, false);
    assert.deepEqual(item.scenarioData.contents.map((c) => c.id), ['board_minutes']);
    assert.equal(log.events.filter(([n]) => n === 'item_unlocked').length, 1);
    assert.ok(log.mfaEvents.some((e) => e.name === 'mfa_approved:gordon'), 'the carried lock names its owner');
    assert.equal(log.toasts.filter((t) => t[0] === 'Not approved.').length, 0);
    assert.ok(window.inventory.items.includes(item), 'the item stays in the tray');
});

test('clicked in the tray, the pane names the lock from the held item and the owner from the gate answer', async () => {
    const fake = carried();
    bootPage(S);
    const item = await inTray(fake);
    net.reset({ '/unlock': [gateForGordon], '/mfa/prompt': ['prompt_waiting'] });
    trayClick(item, 'Unlock');
    await settle();
    await typePin();
    const st = paneState();
    assert.equal(st.open, true);
    assert.equal(st.title, item.scenarioData.name, 'the title is the held item\'s name');
    assert.match(st.text, /A request was sent to gordon's phone\./);
});

test('clicked in the tray and denied: the item stays shut, in the tray, with one "Not approved." and no attempt spent', async () => {
    const fake = carried();
    const log = bootPage(S);
    const item = await inTray(fake);
    net.reset({ '/unlock': [gateForGordon], '/mfa/prompt': ['prompt_expired'] });
    trayClick(item, 'Unlock');
    await settle();
    await typePin();
    await settle(20);
    assert.equal(item.scenarioData.locked, true);
    assert.equal('contents' in item.scenarioData, false);
    assert.equal(net.posted('/unlock').length, 1);
    assert.equal(log.toasts.filter((t) => t[0] === 'Not approved.').length, 1);
    assert.equal(log.events.some(([n]) => n === 'item_unlocked'), false);
    assert.equal(window.MinigameFramework.ended[0].result.cancelled, true);
    assert.ok(window.inventory.items.includes(item));
});

test('a carried gated item clicked again after a cancel starts over: a new pad, a new gate, a pass opens it', async () => {
    const fake = carried();
    bootPage(S);
    const item = await inTray(fake);
    net.reset({ '/unlock': [gateForGordon, gateForGordon, openBriefcase], '/mfa/prompt': ['prompt_expired', 'prompt_passed'] });
    trayClick(item, 'Unlock');
    await settle();
    await typePin();
    await settle(20);
    assert.equal(item.scenarioData.locked, true);
    trayClick(item, 'Unlock');
    await settle();
    await typePin();
    await settle(20);
    assert.equal(item.scenarioData.locked, false);
    assert.equal(net.posted('/unlock').length, 3);
    assert.equal(net.posted('/mfa/prompt').length, 2);
});

test('the player closing the pane over a carried item is silent', async () => {
    const fake = carried();
    const log = bootPage(S);
    const item = await inTray(fake);
    net.reset({ '/unlock': [gateForGordon], '/mfa/prompt': ['prompt_waiting'] });
    trayClick(item, 'Unlock');
    await settle();
    await typePin();
    window.__test.lockStep.close();
    await settle(20);
    assert.deepEqual(log.toasts.filter((t) => /approved/i.test(t[0])), []);
    assert.equal(log.sounds.includes('reject'), false);
    assert.equal(item.scenarioData.locked, true);
});

test('the tray menu of the carried briefcase offers Unlock first and a click on it never drops or interacts', async () => {
    const fake = carried();
    const log = bootPage(S);
    const item = await inTray(fake);
    net.reset({ '/unlock': [gateForGordon] });
    item.dispatchEvent(new window.Event('click', { bubbles: true, cancelable: true }));
    const rows = [...document.querySelectorAll('#be-interaction-menu .be-im-item')].map((r) => r.textContent);
    assert.match(rows[0], /Unlock/);
    assert.equal(rows.length, 3);
    assert.equal(log.interactions || 0, 0, 'the real tray listener opened the menu and did not fall through to the click');
    window.closeInteractionMenu?.() || document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
});

test('once the briefcase is open its tray menu has Open and no Unlock', async () => {
    const fake = carried();
    bootPage(S);
    const item = await inTray(fake);
    item.scenarioData.locked = false;
    item.scenarioData.contents = [{ id: 'board_minutes', type: 'notes', name: 'Board minutes' }];
    item.dispatchEvent(new window.Event('click', { bubbles: true, cancelable: true }));
    const rows = [...document.querySelectorAll('#be-interaction-menu .be-im-item')].map((r) => r.textContent);
    assert.equal(rows.some((r) => /Unlock/.test(r)), false);
    assert.match(rows[0], /Open/, 'an opened container that still holds something can be reopened from the tray');
});
