// Objectives: a task can be marked skipped (2026-10-04, sis01 tidy round F2).
// After a SEVER without sign-offs, sis01's two sign-off tasks could never be
// done and stayed open for the rest of the game. They must not be ticked
// (Hacktivity scores on completeness), so they are "skipped": greyed, struck,
// labelled, not counted as completed, and no longer blocking their aim, which
// completes with a gap. Triggered by a scenario `skipTask` eventMapping field
// or a `#skip_task:<id>` ink tag. The server agrees (Game#skip_task!,
// test/controllers/break_escape/reload_persistence_test.rb).
// Run with: node --test test/js/objectives-skip.test.mjs
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
const alerts = [];
window.gameAlert = (msg, kind, title) => alerts.push(`${title}: ${msg}`);

const { ObjectivesManager } = await import(dataUrl(readFileSync(join(js, 'systems/objectives-manager.js'), 'utf8')));
const panelSrc = readFileSync(join(js, 'ui/objectives-panel.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`);
const { ObjectivesPanel } = await import(dataUrl(panelSrc));

function dispatcher() {
    const emitted = [];
    return { on() {}, emit(name) { emitted.push(name); }, emitted };
}

const task = (taskId, extra = {}) => ({ taskId, title: taskId, type: 'manual', status: 'active', ...extra });

// Shaped like sis01's isolation aim and the aim it opens
function scenario() {
    return [
        { aimId: 'isolate', title: 'Authorise Network Isolation', status: 'active', order: 0,
          tasks: [task('ravi_signoff'), task('david_signoff'), task('confirm_panel')] },
        { aimId: 'restore', title: 'Restore', status: 'locked', order: 1,
          unlockCondition: { aimCompleted: 'isolate' },
          tasks: [task('backup')] }
    ];
}

function manager(saved = null, config = {}) {
    window.gameState = { globalVariables: {}, objectives: saved };
    window.breakEscapeConfig = config;
    alerts.length = 0;
    const m = new ObjectivesManager(dispatcher());
    m.initialize(scenario());
    return m;
}

function render(m) {
    const panel = Object.create(ObjectivesPanel.prototype);
    Object.assign(panel, { content: { innerHTML: '', querySelector: () => null },
                           aimCollapsed: {}, aimStatus: {}, manager: m });
    panel.escapeHtml = (s) => String(s);
    panel.render(m.getActiveAims());
    return panel.content.innerHTML;
}

test('a skipped task no longer blocks its aim, which completes and opens the next', async () => {
    const m = manager();
    await m.completeTask('confirm_panel');
    assert.equal(m.getAim('isolate').status, 'active', 'two sign-offs still open');

    await m.skipTask('ravi_signoff');
    await m.skipTask('david_signoff');

    assert.equal(m.getTask('ravi_signoff').status, 'skipped');
    assert.equal(m.getAim('isolate').status, 'completed', 'completes with a gap');
    assert.equal(m.getAim('restore').status, 'active', 'aimCompleted opens the next aim');
});

test('a skipped task is never shown as done; the panel greys, strikes and labels it', async () => {
    const m = manager();
    await m.completeTask('ravi_signoff');
    await m.skipTask('david_signoff');

    const html = render(m);
    assert.match(html, /task-completed" data-task-id="ravi_signoff"/);
    assert.match(html, /task-skipped" data-task-id="david_signoff"/);
    const row = html.slice(html.indexOf('data-task-id="david_signoff"'));
    assert.match(row.slice(0, row.indexOf('</div>')), /task-skipped-label">skipped</);
    assert.doesNotMatch(row.slice(0, row.indexOf('</div>')), /✓/);
});

test('skipping leaves a completed task alone, and a second skip does nothing', async () => {
    const m = manager();
    await m.completeTask('ravi_signoff');
    await m.skipTask('ravi_signoff');
    assert.equal(m.getTask('ravi_signoff').status, 'completed');

    await m.skipTask('david_signoff');
    const at = m.getTask('david_signoff').skippedAt;
    await m.skipTask('david_signoff');
    assert.equal(m.getTask('david_signoff').skippedAt, at);
    assert.equal(m.getTask('nope'), null);
    await m.skipTask('nope'); // unknown id is ignored
});

test('a skipped task can still be completed later', async () => {
    const m = manager();
    await m.skipTask('ravi_signoff');
    await m.completeTask('ravi_signoff');
    assert.equal(m.getTask('ravi_signoff').status, 'completed');
});

test('reload: a skipped task comes back skipped and still lets the aim complete', async () => {
    const m = manager({
        aims: {},
        tasks: { ravi_signoff: { status: 'skipped', skippedAt: '2026-10-04T09:00:00Z' },
                 david_signoff: { status: 'skipped' } }
    });
    assert.equal(m.getTask('ravi_signoff').status, 'skipped');
    assert.equal(m.getTask('ravi_signoff').skippedAt, '2026-10-04T09:00:00Z');

    await m.completeTask('confirm_panel');
    assert.equal(m.getAim('isolate').status, 'completed');
});

test('the server records the skip; a refusal leaves the task open', async () => {
    const calls = [];
    globalThis.fetch = async (url, opts) => {
        calls.push([url, opts.method]);
        return { ok: true, json: async () => ({ success: true, status: 'skipped', missionConcluded: false }) };
    };
    const m = manager(null, { gameId: 42 });
    await m.skipTask('ravi_signoff');
    assert.deepEqual(calls, [['/break_escape/games/42/objectives/tasks/ravi_signoff/skip', 'POST']]);
    assert.equal(m.getTask('ravi_signoff').status, 'skipped');

    globalThis.fetch = async () => ({ ok: false, status: 422, json: async () => ({ success: false, error: 'Task not found' }) });
    await m.skipTask('david_signoff');
    assert.equal(m.getTask('david_signoff').status, 'active', 'not shown as skipped if the server did not record it');
    delete globalThis.fetch;
});
