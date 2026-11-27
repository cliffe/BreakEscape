// Objectives: completing a task that is already complete, or finishing a second optional
// task in an aim that already completed, never raises a second "Task Complete" or
// "Objective Complete!" toast for the first one (lab_physical_pentest blind playtest 2,
// finding 12: two eventMappings both complete wireless_harvest, one per harvest page).
// Run with: node test/js/objectives-no-repeat-toast.test.mjs
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
const toasts = [];
window.gameAlert = (message, type, title) => { toasts.push(`${title}: ${message}`); };

const { ObjectivesManager } = await import(dataUrl(readFileSync(join(js, 'systems/objectives-manager.js'), 'utf8')));

const task = (taskId, extra = {}) => ({ taskId, title: taskId, type: 'manual', status: 'active', ...extra });

function manager() {
    window.gameState = { globalVariables: {}, objectives: null };
    window.breakEscapeConfig = {};
    toasts.length = 0;
    const m = new ObjectivesManager({ on() {}, emit() {} });
    m.initialize([
        { aimId: 'wireless', title: 'Wireless (optional)', status: 'active', order: 0,
          tasks: [task('wireless_harvest'), task('opt_key', { optional: true }), task('opt_account', { optional: true })] }
    ]);
    return m;
}

const count = (needle) => toasts.filter((t) => t.includes(needle)).length;

test('the second harvest page completing the same task adds no toast for it', async () => {
    const m = manager();
    await m.completeTask('wireless_harvest');
    await m.completeTask('opt_key');
    await m.completeTask('wireless_harvest');
    await m.completeTask('opt_account');
    assert.equal(count('wireless_harvest'), 1);
    assert.equal(count('Wireless (optional)'), 1, 'the aim toast fires once');
    assert.equal(count('opt_key'), 1);
    assert.equal(count('opt_account'), 1);
});

test('two completions raised together for one task toast once', async () => {
    const m = manager();
    await Promise.all([m.completeTask('wireless_harvest'), m.completeTask('wireless_harvest')]);
    assert.equal(count('wireless_harvest'), 1);
    assert.equal(count('Wireless (optional)'), 1);
});
