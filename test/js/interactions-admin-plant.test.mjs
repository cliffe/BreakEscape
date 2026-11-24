// Unit 11 of S5a (privilege plan P485-501, P535-541, P698-726): the requiresItem plant in
// systems/interactions.js. Real interactions.js, apply-actions.js, pc-policy.js and pc-sessions.js;
// the rest of interactions.js's imports are stubbed.
// Run: PATH=... bin/test-js test/js/interactions-admin-plant.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const read = (rel) => readFileSync(join(js, rel), 'utf8');
const swap = (src, map) => Object.entries(map).reduce((s, [k, v]) => s.split(`'${k}'`).join(`'${dataUrl(v)}'`), src);

const alerts = [];
const emitted = [];
const adminAsked = [];
globalThis.window = {
    gameState: { globalVariables: {} },
    gameScenario: {},
    eventDispatcher: { on() {}, off() {}, emit: (n, d) => emitted.push([n, d]) },
    gameAlert: (...a) => alerts.push(a),
    breakEscapeConfig: { gameId: 7 },
    MinigameFramework: { currentMinigame: null }
};
globalThis.document = { querySelector: () => null };

const applyActionsUrl = dataUrl(swap(read('systems/apply-actions.js'), {
    '../utils/display-dashes.js': 'export const displayDashes = (s) => s;',
    '../utils/author-html.js': 'export const authorHtml = (s) => String(s == null ? "" : s);',
    './global-writer.js': 'export function writeGlobal(k, v) { window.gameState.globalVariables[k] = v; }',
    './social-intel.js': 'export function grantFact() {} export function readyToastText() { return ""; } export function readyToastTitle() { return ""; }'
}));
const applyMod = await import(applyActionsUrl);
const { sendInventoryRemove, plantsInFlight, itemsInFlight } = applyMod;
await import(dataUrl(read('systems/pc-policy.js')));
const { PcSessions } = await import(dataUrl(swap(read('systems/pc-sessions.js'),
    { '../utils/sync-before-fetch.js': read('utils/sync-before-fetch.js') })));

const stubs = {
    '../utils/constants.js': 'export const INTERACTION_RANGE=1e6, INTERACTION_RANGE_SQ=1e12, INTERACTION_CHECK_INTERVAL=0, DOOR_INTERACTION_RANGE_SQ=0; export function overlayDepth(){return 0;}',
    '../core/rooms.js': 'export const rooms={};',
    '../core/player.js': 'export function facePlayerToward(){}',
    './unlock-system.js': 'export function handleUnlock(){}',
    './doors.js': 'export function handleDoorInteraction(){}',
    './biometrics.js': 'export function collectFingerprint(){} export function handleBiometricScan(){}',
    './inventory.js': 'export function addToInventory(){return true;} export function createItemIdentifier(){return "";}',
    './ui-sounds.js': 'export function playUISound(){} export function playGameSound(){}',
    '../utils/conditional-text.js': 'export function resolveObjectField(obj,key){ return obj ? obj[key] : undefined; }',
    '../utils/flag-lock.js': 'export function isRemoteFlagLock(){return false;} export function remoteFlagLockMessage(){return "";}',
    './npc-reach.js': 'export function npcReachDistSq(){return 0;}',
    './examine.js': 'export function shouldExamine(){return false;} export function startExamine(){return false;}',
    './combat-input.js': 'export function showPastTalkingToast(){}',
    './consumables.js': 'export function shouldConsumeOnInteract(){return false;} export function useConsumable(){}',
    './interaction-walls.js': 'export function interactionLineClear(){return true;}',
    '../utils/locked-hint.js': 'export function hintToastMs(){ return 6000; }',
    './requires-item-hint.js': 'export function requiresItemHint(d){ return "Need: " + d.requiresItem; }',
    './interaction-reach.js': 'export function reachX(){return 0;} export function reachYSeated(){return 0;} export function directionAngle(){return 0;} export function pickInteractable(){return null;} export function seatedNpcReachDistSq(){return 0;}',
    './minigame-registry.js': 'export function hasMinigameStarter(){return false;} export function startRegisteredMinigame(){}',
    '../utils/display-dashes.js': 'export function displayDashes(s){ return s; }',
    '../utils/escape-html.js': 'export function escapeHtml(s){ return String(s ?? ""); }',
    './inventory-menu.js': 'export function hasTriggerOnInteract(d){return Array.isArray(d?.triggerOnInteract) && d.triggerOnInteract.length>0;} export function isDroppableInventoryItem(){return false;} export function dropInventoryItem(){} export function inventoryMenuFor(){return null;}'
};
let src = swap(read('systems/interactions.js'), { ...stubs });
// apply-actions.js and pc-policy.js are the real modules
src = src.split("'./apply-actions.js'").join(`'${applyActionsUrl}'`);
src = src.split("'./pc-policy.js'").join(`'${dataUrl(read('systems/pc-policy.js'))}'`);
const { handleObjectInteraction } = await import(dataUrl(src));

const quiet = async (fn) => {
    const l = console.log, w = console.warn, e = console.error; console.log = console.warn = console.error = () => {};
    try { return await fn(); } finally { console.log = l; console.warn = w; console.error = e; }
};
const tick = () => new Promise(r => setTimeout(r, 5));
const resp = (status, body) => ({ ok: status < 400, status, json: async () => { if (body === undefined) throw new Error('no body'); return body; } });
const marker = { type: 'set_global', key: 'after', value: true };
const ran = () => window.gameState.globalVariables.after === true;

const stickItem = (id, usbClass = 'storage') => ({ objectId: 'inventory_' + id, scenarioData: { id, type: 'usb', name: id, usbClass, takeable: false } });
const POLICIES = { policies: { locked: { usb: 'blocked' } } };
const socketData = (id, extra = {}) => ({ id, type: 'dock', name: id, policy: 'locked', requiresItem: 'usb',
    consumesItem: true, triggerOnInteract: [marker], ...extra });
const socketSprite = (data) => ({ objectId: data.id, x: 0, y: 0, scenarioData: data });

let held, removed, posts, responses, mirror;
function setup(items, extra = {}) {
    held = items.slice(); removed = []; posts = []; alerts.length = 0; emitted.length = 0;
    plantsInFlight.clear(); itemsInFlight.clear();
    window.gameState.globalVariables = {};
    window.gameScenario = POLICIES;
    window.inventory = { get items() { return held; } };
    window.removeFromInventory = (it) => { removed.push(it.scenarioData.id); held = held.filter(h => h !== it); };
    window.sendInventoryRemove = sendInventoryRemove;
    mirror = new PcSessions();
    mirror.load({}, []);
    window.pcSessions = mirror;
    Object.assign(window, extra);
    globalThis.fetch = async (url, init) => {
        posts.push(JSON.parse(init.body));
        const r = responses.shift();
        if (r instanceof Error) throw r;
        return r;
    };
}

test('a gated consumesItem plant waits for the answer; the item and the actions follow success only', async () => {
    const stick = stickItem('s1');
    setup([stick]);
    let release;
    responses = [new Promise(r => { release = r; })];
    globalThis.fetch = async (url, init) => { posts.push(JSON.parse(init.body)); return responses[0]; };
    // an admin keyboard session at the socket's own id lifts the policy
    mirror.load({ sock: { npcId: 'a', username: 'a', via: 'password', access: 'admin' } }, ['sock']);
    await quiet(async () => {
        handleObjectInteraction(socketSprite(socketData('sock')));
        await tick();
        assert.equal(posts.length, 1, 'remove sent first');
        assert.equal(posts[0].used_on ?? posts[0].usedOn, 'sock');
        assert.deepEqual(removed, [], 'item still held while waiting');
        assert.equal(ran(), false, 'no triggerOnInteract yet');
        assert.ok(plantsInFlight.has('sock') && itemsInFlight.has('s1'));
        release(resp(200, { success: true }));
        await tick();
    });
    assert.deepEqual(removed, ['s1']);
    assert.equal(ran(), true);
    assert.equal(plantsInFlight.size + itemsInFlight.size, 0);
});

test('a 422 usb_refused keeps the item, shows the server line, emits usb_refused and fires nothing', async () => {
    const stick = stickItem('s1');
    setup([stick]);
    mirror.load({ sock: { npcId: 'a', username: 'a', via: 'password', access: 'admin' } }, ['sock']);
    responses = [resp(422, { reason: 'usb_refused', error: 'Policy says no.' })];
    await quiet(async () => { handleObjectInteraction(socketSprite(socketData('sock'))); await tick(); });
    assert.deepEqual(removed, []);
    assert.equal(held.length, 1);
    assert.equal(ran(), false);
    assert.equal(alerts.at(-1)[0], 'Policy says no.');
    assert.ok(emitted.some(([n, d]) => n === 'usb_refused:sock' && d.itemId === 's1'));
    assert.equal(plantsInFlight.size + itemsInFlight.size, 0);
});

test('a stick refused for a remote USER entry shows the policy line and stays, with nothing sent', async () => {
    setup([stickItem('s1')]);
    mirror.load({ sock: { npcId: 'a', username: 'a', via: 'credential', remote: true, footholdId: 'f1', host: 'PC' } }, ['sock']);
    responses = [];
    await quiet(async () => { handleObjectInteraction(socketSprite(socketData('sock'))); await tick(); });
    assert.equal(posts.length, 0);
    assert.deepEqual(removed, []);
    assert.equal(ran(), false);
    assert.match(alerts.at(-1)[0], /\S/);
    assert.ok(emitted.some(([n]) => n === 'usb_refused:sock'));
});

test('a socket with a session grant and its own policy follows keyboardAdmin of the grant PC', async () => {
    const grant = { type: 'grant_foothold', needsSession: 'pc1', pc: 'pc1' };
    const data = () => socketData('dock', { triggerOnInteract: [grant, marker] });
    // keyboard admin at pc1: lifted, so the remove is sent
    setup([stickItem('s1')]);
    mirror.load({ pc1: { npcId: 'a', username: 'a', via: 'password', access: 'admin' } }, ['pc1']);
    responses = [resp(200, { success: true })];
    await quiet(async () => { handleObjectInteraction(socketSprite(data())); await tick(); });
    assert.equal(posts.length, 1, 'keyboard admin at the grant PC lets the stick through');
    // admin at the socket's own id only: not the grant's PC, so refused
    setup([stickItem('s1')]);
    mirror.load({ dock: { npcId: 'a', username: 'a', via: 'password', access: 'admin' } }, ['dock']);
    await quiet(async () => { handleObjectInteraction(socketSprite(data())); await tick(); });
    assert.equal(posts.length, 0);
    assert.equal(held.length, 1);
    // a remote admin at pc1 is not keyboard admin: refused
    setup([stickItem('s1')]);
    mirror.load({ pc1: { npcId: 'a', username: 'a', via: 'technique', remote: true, footholdId: 'f1', access: 'admin' } }, ['pc1']);
    await quiet(async () => { handleObjectInteraction(socketSprite(data())); await tick(); });
    assert.equal(posts.length, 0);
});

test('a second interact while the plant is in flight sends nothing', async () => {
    setup([stickItem('s1')]);
    mirror.load({ sock: { npcId: 'a', username: 'a', via: 'password', access: 'admin' } }, ['sock']);
    let release;
    globalThis.fetch = async (url, init) => { posts.push(1); return new Promise(r => { release = r; }); };
    await quiet(async () => {
        const sprite = socketSprite(socketData('sock'));
        handleObjectInteraction(sprite);
        await tick();
        handleObjectInteraction(sprite);
        await tick();
        assert.equal(posts.length, 1);
        release(resp(200, { success: true }));
        await tick();
    });
    assert.deepEqual(removed, ['s1']);
});

test('a second object asking for the same item in flight takes the not-held path', async () => {
    setup([stickItem('s1')]);
    mirror.load({ sock: { npcId: 'a', username: 'a', via: 'password', access: 'admin' },
                  other: { npcId: 'a', username: 'a', via: 'password', access: 'admin' } }, ['sock', 'other']);
    let release;
    globalThis.fetch = async () => { posts.push(1); return new Promise(r => { release = r; }); };
    await quiet(async () => {
        handleObjectInteraction(socketSprite(socketData('sock')));
        await tick();
        alerts.length = 0;
        handleObjectInteraction(socketSprite(socketData('other')));
        await tick();
        assert.equal(posts.length, 1, 'only one server plant');
        assert.equal(alerts.at(-1)[0], 'Need: usb', 'the hint, as when nothing is held');
        release(resp(200, { success: true }));
        await tick();
    });
});

test('when both attempts fail the item stays and the next try succeeds and fires once', async () => {
    setup([stickItem('s1')]);
    mirror.load({ sock: { npcId: 'a', username: 'a', via: 'password', access: 'admin' } }, ['sock']);
    const sprite = socketSprite(socketData('sock', { triggerOnInteract: [{ type: 'set_global', key: 'count', value: 1 }] }));
    responses = [new Error('net'), new Error('net'), resp(200, { success: true })];
    await quiet(async () => {
        handleObjectInteraction(sprite);
        await new Promise(r => setTimeout(r, 1500));
        assert.equal(held.length, 1, 'item stays after the failed send');
        assert.equal(window.gameState.globalVariables.count, undefined);
        assert.equal(plantsInFlight.size + itemsInFlight.size, 0);
        assert.match(alerts.at(-1)[0], /did not go through/);
        handleObjectInteraction(sprite);
        await tick();
    });
    assert.deepEqual(removed, ['s1']);
    assert.equal(window.gameState.globalVariables.count, 1);
});

test('plantAdmin gives interactions.js and apply-actions.js the same answer for the same object', async () => {
    const seen = [];
    setup([stickItem('s1')]);
    window.pcSessions = { plantAdmin: (d) => { seen.push(d); return mirror.plantAdmin(d); } };
    mirror.load({ sock: { npcId: 'a', username: 'a', via: 'password', access: 'admin' } }, ['sock']);
    // the shared singleton the plain export reads is its own instance; compare by the object passed
    const data = socketData('sock', { triggerOnInteract: [{ type: 'confirm_action', onConfirm: [{ type: 'remove_item', item: 'usb' }, marker] }], consumesItem: false });
    responses = [resp(200, { success: true })];
    window.gameConfirm = async () => true;
    await quiet(async () => {
        handleObjectInteraction(socketSprite(data));
        await tick();
        await tick();
    });
    delete window.gameConfirm;
    assert.equal(posts.length, 1, 'the confirm ran and the remove_item inside it was sent');
    assert.ok(seen.length >= 2, 'both interactions.js and apply-actions.js asked');
    assert.ok(seen.every(d => d === data), 'every call is made with the sprite scenarioData');
    // the interactions.js side asks with the object; apply-actions.js gets the same object through objectData
    assert.equal(seen[0], data);
});

test('an ungoverned or policy-accepted plant keeps today\'s order and fire-and-forget send', async () => {
    setup([stickItem('s1')], { gameScenario: { policies: { open: { usb: 'allowed' } } } });
    responses = [resp(200, { success: true })];
    await quiet(async () => {
        handleObjectInteraction(socketSprite(socketData('sock', { policy: 'open' })));
    });
    assert.ok(ran(), 'fires at once');
    assert.deepEqual(removed, ['s1'], 'removed at once');
    assert.equal(plantsInFlight.size, 0);
});

test('an object with triggerOnInteract and no requiresItem does not run a second pass while its remove is in flight', async () => {
    setup([stickItem('s1')]);
    mirror.load({ sock: { npcId: 'a', username: 'a', via: 'password', access: 'admin' } }, ['sock']);
    let release;
    globalThis.fetch = async () => { posts.push(1); return new Promise(r => { release = r; }); };
    const data = socketData('sock', { requiresItem: undefined, consumesItem: undefined,
        triggerOnInteract: [{ type: 'remove_item', item: 'usb' }, marker] });
    await quiet(async () => {
        const sprite = socketSprite(data);
        handleObjectInteraction(sprite);
        await tick();
        handleObjectInteraction(sprite);
        await tick();
        assert.equal(posts.length, 1);
        assert.equal(window.gameState.globalVariables.after, undefined, 'the marker has not run before the answer');
        release(resp(200, { success: true }));
        await tick();
    });
    assert.deepEqual(removed, ['s1']);
});
