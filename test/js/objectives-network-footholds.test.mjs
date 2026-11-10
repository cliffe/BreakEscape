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

function manager({ gained = [] } = {}) {
    window.gameState = { globalVariables: {}, objectives: null };
    window.breakEscapeConfig = {};
    window.pcSessions = { wasSignedIn: () => false };
    window.networkLinks = { wasGained: (id) => gained.includes(id) };
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
            { taskId: 'bench_task', title: 'Plant the box in the workshop', type: 'unlock_object', targetObject: 'bench_port', status: 'active' }
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
