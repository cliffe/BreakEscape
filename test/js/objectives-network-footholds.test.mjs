// Slice 9.3a step 7 (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md 3.5): an unlock_object
// task whose target is a network jack completes on network_foothold_gained for that jack, and
// on load when the jack is in the restored gainedFootholds (network-links.js wasGained), so a
// completion lost before a reload still lands. In the pattern of objectives-signin-pc.test.mjs.
// Run with: node test/js/objectives-network-footholds.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { querySelector: () => null };
window.gameAlert = () => {};

const { ObjectivesManager } = await import(dataUrl(readFileSync(join(js, 'systems/objectives-manager.js'), 'utf8')));

function manager({ gained = [], held = {} } = {}) {
    window.gameState = { globalVariables: {}, objectives: null };
    window.breakEscapeConfig = {};
    window.pcSessions = { wasSignedIn: () => false };
    window.networkLinks = { wasGained: (id) => gained.includes(id), heldAt: (id) => held[id] || null };
    const handlers = new Map();
    const dispatcher = {
        on(name, fn) { if (!handlers.has(name)) handlers.set(name, []); handlers.get(name).push(fn); },
        emit() {},
        fire(name, data) { (handlers.get(name) || []).forEach(fn => fn(data)); }
    };
    const m = new ObjectivesManager(dispatcher);
    m.initialize([
        { aimId: 'net', title: 'Networks', status: 'active', order: 0, tasks: [
            { taskId: 'plant_task', title: 'Plant the box in the comms room', type: 'unlock_object', targetObject: 'comms_port', status: 'active' },
            { taskId: 'bench_task', title: 'Plant the box in the workshop', type: 'unlock_object', targetObject: 'bench_port', status: 'active' },
            { taskId: 'ap_task', title: 'Join the guest Wi-Fi', type: 'unlock_object', targetObject: 'guest_ap', status: 'active' },
            { taskId: 'ap2_task', title: 'Join at the lift', type: 'unlock_object', targetObject: 'guest_ap2', status: 'active' },
            { taskId: 'signin_task', title: "Sign in to Lena's PC", type: 'unlock_object', targetObject: 'lena_pc', status: 'active' }
        ] }
    ]);
    m.dispatcher = dispatcher;
    return m;
}
const status = (m, id) => m.taskIndex[id].status;
const settle = () => new Promise(r => setTimeout(r, 0));

test('network_foothold_gained at a jack completes its unlock_object task, and only that one', async () => {
    const m = manager();
    assert.equal(status(m, 'plant_task'), 'active');
    m.dispatcher.fire('network_foothold_gained', { footholdId: 'jack_comms_port', via: 'jack', networkId: 'office_lan', sourceId: 'comms_port' });
    await settle();
    assert.equal(status(m, 'plant_task'), 'completed');
    assert.equal(status(m, 'bench_task'), 'active');
});

test('a plant refusal or an unplug does not complete it', async () => {
    const m = manager();
    m.dispatcher.fire('network_device_refused', { jackId: 'comms_port', reason: 'no_device' });
    m.dispatcher.fire('network_device_unplugged', { jackId: 'comms_port', footholdId: 'jack_comms_port', endedPcIds: [] });
    await settle();
    assert.equal(status(m, 'plant_task'), 'active');
});

test('on load, a jack in the restored gainedFootholds completes its task', async () => {
    const m = manager({ gained: ['comms_port'] });
    await settle();
    assert.equal(status(m, 'plant_task'), 'completed');
    assert.equal(status(m, 'bench_task'), 'active');
});

test('on load, a jack never planted at leaves the task open', async () => {
    const m = manager({ gained: [] });
    await settle();
    assert.equal(status(m, 'plant_task'), 'active');
});

// Slice 9.3b (review R1 E1): an access point task completes on the join, a second access point
// of a joined network included; an implant meets no task on its PC, live or on load.

test('network_joined at an access point completes its unlock_object task, with one POST', async () => {
    const m = manager();
    // Both listeners fire on a first join; the completing guard lets one request out (review R2 n2)
    const posts = [];
    m.serverCompleteTask = async (taskId) => { posts.push(taskId); return { success: true }; };
    m.dispatcher.fire('network_joined', { apId: 'guest_ap', footholdId: 'wifi_guest_wifi', networkId: 'guest_wifi', already: false });
    m.dispatcher.fire('network_foothold_gained', { footholdId: 'wifi_guest_wifi', via: 'wifi', networkId: 'guest_wifi', sourceId: 'guest_ap' });
    await settle();
    assert.equal(status(m, 'ap_task'), 'completed');
    assert.equal(status(m, 'ap2_task'), 'active');
    assert.deepEqual(posts, ['ap_task'], 'exactly one task POST');
});

test('an already join at a second access point completes that access point\'s task', async () => {
    const m = manager();
    m.dispatcher.fire('network_joined', { apId: 'guest_ap2', footholdId: 'wifi_guest_wifi', networkId: 'guest_wifi', already: true });
    await settle();
    assert.equal(status(m, 'ap2_task'), 'completed');
});

test('an implant on a PC does not complete the sign-in task on that PC', async () => {
    const m = manager();
    let alerts = 0;
    window.gameAlert = () => { alerts++; };
    m.dispatcher.fire('network_foothold_gained', { footholdId: 'implant_lena_pc', via: 'implant', networkId: 'office_lan', sourceId: 'lena_pc' });
    await settle();
    assert.equal(status(m, 'signin_task'), 'active');
    assert.equal(alerts, 0, 'no Objective Blocked alert');
    window.gameAlert = () => {};
});

test('on load, an access point in gainedFootholds completes its task; an implant PC does not', async () => {
    const m = manager({ gained: ['guest_ap2', 'lena_pc'], held: { lena_pc: { id: 'implant_lena_pc', via: 'implant' } } });
    await settle();
    assert.equal(status(m, 'ap2_task'), 'completed');
    assert.equal(status(m, 'signin_task'), 'active');
});
