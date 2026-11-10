// Access model step 8 (docs/achitechture/ACCESS_MODEL_PLAN.md 5.3): an unlock_object task
// whose target is a sign-in PC completes on pc_signed_in for that PC (as item_unlocked
// completes it for other locks), and on load when the PC is in the restored signedInPcs
// (pc-sessions.js wasSignedIn), so a completion lost before a reload still lands.
// Run with: node test/js/objectives-signin-pc.test.mjs
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

function manager({ signedIn = [] } = {}) {
    window.gameState = { globalVariables: {}, objectives: null };
    window.breakEscapeConfig = {};
    window.pcSessions = { wasSignedIn: (id) => signedIn.includes(id) };
    const handlers = new Map();
    const dispatcher = {
        on(name, fn) { if (!handlers.has(name)) handlers.set(name, []); handlers.get(name).push(fn); },
        emit() {},
        fire(name, data) { (handlers.get(name) || []).forEach(fn => fn(data)); }
    };
    const m = new ObjectivesManager(dispatcher);
    m.initialize([
        { aimId: 'signin', title: 'Sign in', status: 'active', order: 0, tasks: [
            { taskId: 'ian_pc_task', title: 'Sign in to Ian\'s PC', type: 'unlock_object', targetObject: 'ian_pc', status: 'active' },
            { taskId: 'other_task', title: 'Something else', type: 'unlock_object', targetObject: 'cabinet', status: 'active' },
            { taskId: 'loose_task', title: 'No target', type: 'unlock_object', status: 'active' }
        ] }
    ]);
    m.dispatcher = dispatcher;
    return m;
}
const status = (m, id) => m.taskIndex[id].status;
const settle = () => new Promise(r => setTimeout(r, 0));

test('pc_signed_in for the target PC completes its unlock_object task, and only that one', async () => {
    const m = manager();
    assert.equal(status(m, 'ian_pc_task'), 'active', 'not before a sign-in');
    m.dispatcher.fire('pc_signed_in', { pcId: 'hot_desk', npcId: 'sam', username: 'sokafor', via: 'password' });
    await settle();
    assert.equal(status(m, 'ian_pc_task'), 'active');
    m.dispatcher.fire('pc_signed_in', { pcId: 'ian_pc', npcId: 'ian', username: 'ishaw', via: 'password' });
    await settle();
    assert.equal(status(m, 'ian_pc_task'), 'completed');
    assert.equal(status(m, 'other_task'), 'active');
    assert.equal(status(m, 'loose_task'), 'active', 'a task with no target is not met by a sign-in');
});

test('on load, a PC in the restored signedInPcs completes its task', async () => {
    const m = manager({ signedIn: ['ian_pc'] });
    await settle();
    assert.equal(status(m, 'ian_pc_task'), 'completed');
    assert.equal(status(m, 'other_task'), 'active');
});

test('on load, a PC not signed in to leaves the task open', async () => {
    const m = manager({ signedIn: ['hot_desk'] });
    await settle();
    assert.equal(status(m, 'ian_pc_task'), 'active');
});
