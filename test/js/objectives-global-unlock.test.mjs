// Objectives: a globalVariable unlockCondition opens its aim when the global
// changes, in a lab game (DOCS_GAPS gap 20, 2026-10-22). The SE docs proof set
// soc_key_given in play and the aim stayed locked: the condition was checked
// only on load (server side), so the aim opened only when an eventMapping or
// #unlock_aim also called unlockAim. game.js now passes liveGlobalUnlock for a
// scenario with a `social` block; every other scenario keeps the old behaviour.
// Run with: node --test test/js/objectives-global-unlock.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { gameState: { globalVariables: {} } };
const alerts = [];
window.gameAlert = (msg, kind, title) => alerts.push(`${title}: ${msg}`);

const { ObjectivesManager } = await import(dataUrl(readFileSync(join(js, 'systems/objectives-manager.js'), 'utf8')));

// A minimal on/off/emit dispatcher, like NPCEventDispatcher for exact names
function dispatcher() {
    const handlers = new Map();
    return {
        on(name, fn) { if (!handlers.has(name)) handlers.set(name, []); handlers.get(name).push(fn); },
        off(name, fn) { handlers.set(name, (handlers.get(name) || []).filter(f => f !== fn)); },
        emit(name, data) { (handlers.get(name) || []).slice().forEach(fn => fn(data)); },
        count(name) { return (handlers.get(name) || []).length; }
    };
}

const task = (taskId, extra = {}) => ({ taskId, title: taskId, type: 'custom', status: 'active', ...extra });

function aims() {
    return [
        { aimId: 'recon', title: 'Recon', status: 'active', order: 0, tasks: [task('osint')] },
        { aimId: 'defend', title: 'Defend', status: 'locked', order: 1,
          unlockCondition: { globalVariable: 'soc_key_given', equals: true },
          tasks: [task('triage', { status: 'locked' }), task('board')] },
        { aimId: 'bare', title: 'Bare global', status: 'locked', order: 2,
          unlockCondition: { globalVariable: 'door_seen' },
          tasks: [task('look')] },
        { aimId: 'named', title: 'Named value', status: 'locked', order: 3,
          unlockCondition: { globalVariable: 'latched', equals: 'trusts' },
          tasks: [task('ask')] }
    ];
}

function setGlobal(d, name, value) {
    window.gameState.globalVariables[name] = value;
    d.emit(`global_variable_changed:${name}`, { name, value });
}

function fresh(options) {
    window.gameState.globalVariables = {};
    window.gameState.objectives = null;
    alerts.length = 0;
    const d = dispatcher();
    const m = new ObjectivesManager(d);
    m.initialize(aims(), options);
    return { d, m };
}

test('live: the aim opens when its global turns true, with its first task', () => {
    const { d, m } = fresh({ liveGlobalUnlock: true });
    assert.equal(m.aimIndex.defend.status, 'locked');
    setGlobal(d, 'soc_key_given', true);
    assert.equal(m.aimIndex.defend.status, 'active');
    assert.equal(m.taskIndex.triage.status, 'active');
    assert.equal(alerts.filter(a => a.includes('Defend')).length, 1);
});

test('live: a later unlockAim from a mapping does not notify twice', () => {
    const { d, m } = fresh({ liveGlobalUnlock: true });
    setGlobal(d, 'soc_key_given', true);
    m.unlockAim('defend');
    assert.equal(alerts.filter(a => a.includes('Defend')).length, 1);
});

test('live: equals compares the value; a bare global needs only a truthy value', () => {
    const { d, m } = fresh({ liveGlobalUnlock: true });
    setGlobal(d, 'latched', 'wary');
    assert.equal(m.aimIndex.named.status, 'locked');
    setGlobal(d, 'latched', 'trusts');
    assert.equal(m.aimIndex.named.status, 'active');
    setGlobal(d, 'door_seen', 1);
    assert.equal(m.aimIndex.bare.status, 'active');
});

test('live: a global already set when the objectives load opens the aim at once', () => {
    window.gameState.globalVariables = { soc_key_given: true };
    window.gameState.objectives = null;
    const d = dispatcher();
    const m = new ObjectivesManager(d);
    m.initialize(aims(), { liveGlobalUnlock: true });
    assert.equal(m.aimIndex.defend.status, 'active');
});

test('live: tasks done while the aim was story-gated complete it on unlock', () => {
    const { d, m } = fresh({ liveGlobalUnlock: true });
    m.taskIndex.triage.status = 'completed';
    m.taskIndex.board.status = 'completed';
    setGlobal(d, 'soc_key_given', true);
    assert.equal(m.aimIndex.defend.status, 'completed');
});

test('not live (m01-m10): the global changes and the aim stays locked', () => {
    const { d, m } = fresh();
    setGlobal(d, 'soc_key_given', true);
    assert.equal(m.aimIndex.defend.status, 'locked');
    assert.equal(d.count('global_variable_changed:soc_key_given'), 0);
    // The scenario's own unlockAim still opens it, as before
    m.unlockAim('defend');
    assert.equal(m.aimIndex.defend.status, 'active');
});

test('re-initialising drops the old listeners', () => {
    const { d, m } = fresh({ liveGlobalUnlock: true });
    assert.equal(d.count('global_variable_changed:soc_key_given'), 1);
    m.initialize(aims(), {});
    assert.equal(d.count('global_variable_changed:soc_key_given'), 0);
});
