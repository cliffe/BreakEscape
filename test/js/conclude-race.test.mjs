// The conclude race (release-readiness, 2026-11-13).
//
// A task completes on the same beat that sets a global named in the mission's
// concludeRequires.globals. The task-completion POST must not reach the server
// before the state sync carrying that global, or the server answers with a
// conclusion warning that shows as a "Not Yet..." toast over an ending that
// concludes a moment later.
//
// The fix mirrors the conclude path (music/scenario-music-events.js
// concludeMission flushes stateSync.sync() before POST .../conclude):
// ObjectivesManager flushes pending globals before the completion POST, and a
// residual warning triggers a flush + idempotent re-post that can conclude.
//
// Run with: node --test test/js/conclude-race.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { querySelector: () => null };

const { ObjectivesManager } = await import(dataUrl(readFileSync(join(js, 'systems/objectives-manager.js'), 'utf8')));

function dispatcher() {
    const emitted = [];
    return { on() {}, emit(name, payload) { emitted.push({ name, payload }); }, emitted };
}

// A missionConclusion aim with one gate global (the race shape: the final task
// completes on the beat that sets gate_global).
function scenario() {
    return [{
        aimId: 'finish', title: 'Finish', status: 'active', order: 0,
        missionConclusion: true,
        conclusionScreen: { type: 'bond_visualiser' },
        concludeRequires: { globals: ['gate_global'] },
        tasks: [{ taskId: 'final_task', title: 'final', type: 'custom', status: 'active' }]
    }];
}

// A missionConclusion aim that gates on a completed task only -- no
// concludeRequires.globals, so it cannot hit the conclude race and must keep the
// original timing (no pre-flush).
function scenarioNoGlobalGate() {
    return [{
        aimId: 'finish', title: 'Finish', status: 'active', order: 0,
        missionConclusion: true,
        conclusionScreen: { type: 'bond_visualiser' },
        concludeRequires: { tasksCompleted: ['final_task'] },
        tasks: [{ taskId: 'final_task', title: 'final', type: 'custom', status: 'active' }]
    }];
}

// A fetch double that logs call order and answers from a queue of responses
// keyed by the POST path. Only the task-completion POST is modelled here.
function harness(responses, scn = scenario()) {
    const order = [];
    const disp = dispatcher();
    globalThis.window = {
        gameState: { globalVariables: {} },
        breakEscapeConfig: { gameId: 1 },
        gameAlert: (msg, kind, title) => order.push(`alert:${title}`),
        stateSync: { sync: async () => { order.push('sync'); return true; } }
    };
    globalThis.document = { querySelector: () => null };
    let i = 0;
    globalThis.fetch = async (url, opts) => {
        order.push(`post:${url}`);
        const body = responses[Math.min(i, responses.length - 1)];
        i += 1;
        return { status: 200, ok: true, json: async () => body };
    };
    const m = new ObjectivesManager(disp);
    m.initialize(scn);
    return { m, order, disp };
}

test('pending globals are flushed to the server before the task-completion POST', async () => {
    // Server would conclude (the global has reached it by the time the POST lands).
    const { m, order } = harness([{ success: true, missionConcluded: true }]);
    window.gameState.globalVariables.gate_global = true;

    await m.completeTask('final_task');

    const firstPost = order.findIndex(e => e.startsWith('post:'));
    const firstSync = order.indexOf('sync');
    assert.ok(firstSync !== -1, 'the client flushed pending state before completing');
    assert.ok(firstSync < firstPost, 'the flush runs before the completion POST');
});

test('a residual conclusion warning is healed by a flush and an idempotent re-post', async () => {
    // First POST races ahead of the global and is warned; the re-post, after the
    // flush, concludes the mission.
    const { m, order, disp } = harness([
        { success: true, taskId: 'final_task', warning: 'Complete required objectives first to conclude the mission.' },
        { success: true, taskId: 'final_task', message: 'Already completed', missionConcluded: true }
    ]);
    window.gameState.globalVariables.gate_global = true;

    await m.completeTask('final_task');

    assert.ok(disp.emitted.some(e => e.name === 'mission_concluded'),
        'the mission concluded after the re-post');
    assert.ok(!order.some(e => e === 'alert:Not Yet…'),
        'no "Not Yet" toast is shown when the re-post concludes');
});

// --- M2: the pre-flush is scoped to scenarios that gate on a global ---

test('a scenario whose conclusion gates on a global pre-flushes before the POST', async () => {
    const { m, order } = harness([{ success: true, missionConcluded: true }]);
    window.gameState.globalVariables.gate_global = true;

    await m.completeTask('final_task');

    const firstPost = order.findIndex(e => e.startsWith('post:'));
    assert.ok(order.indexOf('sync') !== -1 && order.indexOf('sync') < firstPost,
        'the global-gated scenario flushes before the completion POST');
});

test('a scenario with no global conclude gate keeps the original timing (no pre-flush)', async () => {
    const { m, order } = harness([{ success: true, missionConcluded: true }], scenarioNoGlobalGate());

    await m.completeTask('final_task');

    const firstPost = order.findIndex(e => e.startsWith('post:'));
    assert.ok(firstPost !== -1, 'the completion POST was made');
    assert.ok(!order.slice(0, firstPost).includes('sync'),
        'no sync round-trip precedes the POST when nothing gates on a global');
});

// --- m2: a still-unmet gate toasts "Not Yet" exactly once after the fallback ---

test('a gate still unmet after the fallback re-post toasts "Not Yet" exactly once', async () => {
    // Both the first POST and the re-post come back warning (the global never met).
    const { m, order } = harness([
        { success: true, taskId: 'final_task', warning: 'Complete required objectives first to conclude the mission.' }
    ]);

    await m.completeTask('final_task');

    const notYet = order.filter(e => e === 'alert:Not Yet…');
    assert.equal(notYet.length, 1, 'the "Not Yet" toast fires exactly once after the fallback');
});

// --- m2: the skip path also pre-flushes when the scenario gates on a global ---

test('the skip path pre-flushes before the skip POST when the scenario gates on a global', async () => {
    const { m, order } = harness([{ success: true, status: 'skipped' }]);
    window.gameState.globalVariables.gate_global = true;

    await m.skipTask('final_task');

    const firstPost = order.findIndex(e => e.startsWith('post:'));
    assert.ok(firstPost !== -1, 'the skip POST was made');
    assert.ok(order.indexOf('sync') !== -1 && order.indexOf('sync') < firstPost,
        'the flush runs before the skip POST');
});
