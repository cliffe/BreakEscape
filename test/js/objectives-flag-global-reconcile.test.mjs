// A submit_flags task that is already completed in the restored server state,
// but whose story global was never set, must have its objective_task_completed
// event re-announced on game_loaded, so the scenario wiring that sets the global
// (e.g. flag1_submitted → the blast door in m10) can catch up. Without this, a
// reload, a second submission, or a replay that inherits the completed task but
// not the global strands the critical path: the task shows done, the door never
// opens. Repro of the m10 game-92 blocker.
// Run with: node --test test/js/objectives-flag-global-reconcile.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { gameState: { globalVariables: {} } };

const { ObjectivesManager } = await import(dataUrl(readFileSync(join(js, 'systems/objectives-manager.js'), 'utf8')));

function dispatcher() {
    const handlers = new Map();
    return {
        on(name, fn) { if (!handlers.has(name)) handlers.set(name, []); handlers.get(name).push(fn); },
        off(name, fn) { handlers.set(name, (handlers.get(name) || []).filter(f => f !== fn)); },
        emit(name, data) { (handlers.get(name) || []).slice().forEach(fn => fn(data)); }
    };
}

// Two flag stations on one VM, the m10 shape: submit_flag_1 completed in saved
// state, submit_flag_2 still active.
function aims() {
    return [{
        aimId: 'breach', title: 'Breach', status: 'active', order: 0,
        tasks: [
            { taskId: 'submit_flag_1', title: 'Flag 1', type: 'submit_flags',
              targetFlags: ['gate_terminal:bunker_monitor-flag1'], targetCount: 1, status: 'active' },
            { taskId: 'submit_flag_2', title: 'Flag 2', type: 'submit_flags',
              targetFlags: ['release_console:bunker_monitor-flag1'], targetCount: 1, status: 'active' }
        ]
    }];
}

function build() {
    window.gameState.globalVariables = {};
    // Server-restored state: submit_flag_1 already completed (flag accepted
    // server-side), but the story global flag1_submitted was never set.
    window.gameState.objectives = {
        aims: {},
        tasks: { submit_flag_1: { status: 'completed', submittedFlags: ['gate_terminal:bunker_monitor-flag1'] } }
    };
    const d = dispatcher();
    const m = new ObjectivesManager(d);

    // The scenario's story wiring: completing the flag task sets the global
    // (guarded, idempotent — as m10's eventMapping is).
    const fired = [];
    const payloads = [];
    d.on('objective_task_completed:submit_flag_1', (data) => {
        fired.push('submit_flag_1');
        payloads.push(data);
        if (!window.gameState.globalVariables.flag1_submitted) {
            window.gameState.globalVariables.flag1_submitted = true;
        }
    });
    d.on('objective_task_completed:submit_flag_2', () => fired.push('submit_flag_2'));

    m.initialize(aims());
    return { d, m, fired, payloads };
}

test('restore alone does not set the global (nothing re-announces the completed task)', () => {
    const { m } = build();
    assert.equal(m.taskIndex.submit_flag_1.status, 'completed');
    assert.notEqual(window.gameState.globalVariables.flag1_submitted, true);
});

test('game_loaded reconciles the completed flag task, setting its story global', () => {
    const { d, fired } = build();
    d.emit('game_loaded', {});
    assert.deepEqual(fired, ['submit_flag_1']);
    assert.equal(window.gameState.globalVariables.flag1_submitted, true);
});

test('reconcile re-announce is marked _reconcile (npc-manager skips its player-facing side effects)', () => {
    const { d, payloads } = build();
    d.emit('game_loaded', {});
    assert.equal(payloads.length, 1);
    assert.equal(payloads[0]._reconcile, true);
});

test('reconciliation is idempotent and skips still-active flag tasks', () => {
    const { d, fired } = build();
    d.emit('game_loaded', {});
    d.emit('game_loaded', {}); // a second reload must not double-fire into a broken state
    // submit_flag_2 is still active, so it is never announced.
    assert.ok(!fired.includes('submit_flag_2'));
    // submit_flag_1 re-announced each load, but the global guard makes it a no-op.
    assert.equal(window.gameState.globalVariables.flag1_submitted, true);
});
