// Objectives: an aim whose tasks are all optional completes only when every task is
// settled (completed or skipped), not on the first one (7.5c, m07 U5). An aim with a
// required task still completes on its required tasks alone. The server agrees
// (Game#check_aim_completion, test/models/break_escape/game_test.rb AllOptionalAimTest).
// Run with: node --test test/js/objectives-all-optional-aim.test.mjs
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
window.gameAlert = () => {};

const { ObjectivesManager } = await import(dataUrl(readFileSync(join(js, 'systems/objectives-manager.js'), 'utf8')));

const task = (taskId, extra = {}) => ({ taskId, title: taskId, type: 'manual', status: 'active', ...extra });

function manager() {
    window.gameState = { globalVariables: {}, objectives: null };
    window.breakEscapeConfig = {};
    const emitted = [];
    const m = new ObjectivesManager({ on() {}, emit(name) { emitted.push(name); } });
    m.initialize([
        { aimId: 'trace', title: 'Trace How They Got In (Optional)', status: 'active', order: 0,
          tasks: [task('a', { optional: true }), task('b', { optional: true }), task('c', { optional: true })] },
        { aimId: 'mixed', title: 'Mixed', status: 'active', order: 1,
          tasks: [task('req'), task('opt', { optional: true })] }
    ]);
    m.emitted = emitted;
    return m;
}

test('an all-optional aim stays open until each of its tasks is settled', async () => {
    const m = manager();
    await m.completeTask('a');
    assert.equal(m.getAim('trace').status, 'active', 'not complete on the first optional task');
    await m.completeTask('b');
    assert.equal(m.getAim('trace').status, 'active');
    await m.completeTask('c');
    assert.equal(m.getAim('trace').status, 'completed');
    assert.ok(m.emitted.includes('objective_aim_completed:trace'));
});

test('a skipped task settles its place in an all-optional aim', async () => {
    const m = manager();
    await m.completeTask('a');
    await m.skipTask('b');
    assert.equal(m.getAim('trace').status, 'active');
    await m.skipTask('c');
    assert.equal(m.getAim('trace').status, 'completed');
});

test('an aim with a required task still completes on that task alone', async () => {
    const m = manager();
    await m.completeTask('req');
    assert.equal(m.getAim('mixed').status, 'completed');
});
