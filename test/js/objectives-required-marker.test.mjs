// Objectives panel: required tasks carry a '*', optional tasks are unmarked
// and a little dimmer (2026-10-13, user-approved). Players treated every task
// as required, which in m04 pushed them into needless fights. The marker only
// appears in aims that also have an optional task, is purely presentational
// (task.title is unchanged, so toasts, the server and notes are unaffected),
// and a small "* required" key shows in the header of each aim that shows a '*'
// (not in the panel header, which read as if unmarked tasks were optional in
// every aim: 7.5d, m08 E1).
// Run with: node --test test/js/objectives-required-marker.test.mjs
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

const dispatcher = () => ({ on() {}, emit() {} });
const task = (taskId, extra = {}) => ({ taskId, title: `Title ${taskId}`, type: 'manual', status: 'active', ...extra });

function scenario() {
    return [
        { aimId: 'mixed', title: 'Mixed aim', status: 'active', order: 0,
          tasks: [task('req_a'), task('req_b'), task('opt_a', { optional: true }),
                  task('opt_locked', { optional: true, status: 'locked' })] },
        { aimId: 'plain', title: 'Plain aim', status: 'active', order: 1,
          tasks: [task('plain_a'), task('plain_b')] }
    ];
}

function manager(aims = scenario()) {
    window.gameState = { globalVariables: {}, objectives: null };
    window.breakEscapeConfig = {};
    alerts.length = 0;
    const m = new ObjectivesManager(dispatcher());
    m.initialize(aims);
    return m;
}

function panelFor(m) {
    const panel = Object.create(ObjectivesPanel.prototype);
    Object.assign(panel, { content: { innerHTML: '', querySelector: () => null },
                           aimCollapsed: {}, aimStatus: {}, manager: m });
    panel.escapeHtml = (s) => String(s);
    return panel;
}

function render(m) {
    const panel = panelFor(m);
    panel.render(m.getActiveAims());
    const html = panel.content.innerHTML;
    return { html, keyShown: html.includes(KEY), keyIn: (aimId) => aimHeader(html, aimId).includes(KEY) };
}

const KEY = 'class="aim-required-key"';
const aimHeader = (html, aimId) => {
    const start = html.indexOf(`data-aim-id="${aimId}"`);
    return start < 0 ? '' : html.slice(start, html.indexOf('</div>', html.indexOf('class="aim-header"', start)));
};

const row = (html, id) => {
    const start = html.lastIndexOf('<div', html.indexOf(`data-task-id="${id}"`));
    return html.slice(start, html.indexOf('</div>', start));
};
const MARK = 'task-required-mark';

test('required tasks get a * in an aim with an optional task; optional tasks are unmarked and dimmed', () => {
    const { html, keyShown } = render(manager());
    assert.match(row(html, 'req_a'), new RegExp(`Title req_a<span class="${MARK}"[^>]*>\\*</span>`));
    assert.match(row(html, 'req_b'), new RegExp(MARK));
    assert.doesNotMatch(row(html, 'opt_a'), new RegExp(MARK));
    assert.match(row(html, 'opt_a'), /task-active task-optional"/);
    assert.doesNotMatch(row(html, 'req_a'), /task-optional/);
    assert.equal(keyShown, true, 'key explains the *');
});

test('the key sits beside the aim that uses the marker, not beside aims without optional tasks', () => {
    const { html, keyIn } = render(manager());
    assert.equal(keyIn('mixed'), true);
    assert.equal(keyIn('plain'), false);
    assert.equal(html.split(KEY).length - 1, 1, 'one key, for the one marked aim');
    assert.match(aimHeader(html, 'mixed'), /aim-title">Mixed aim<\/span><span class="aim-required-key" title="In this aim/);
});

test('an aim with no optional tasks looks as before: no marker', () => {
    const { html } = render(manager());
    assert.doesNotMatch(row(html, 'plain_a'), new RegExp(MARK));
    assert.doesNotMatch(row(html, 'plain_b'), new RegExp(MARK));
});

test('no optional tasks anywhere: no marker and the key stays hidden', () => {
    const { html, keyShown } = render(manager([
        { aimId: 'plain', title: 'Plain aim', status: 'active', order: 0, tasks: [task('a'), task('b')] }]));
    assert.doesNotMatch(html, new RegExp(MARK));
    assert.equal(keyShown, false);
});

test('a locked optional task does not count, so its aim gets no marker', () => {
    const { html, keyShown } = render(manager([
        { aimId: 'x', title: 'X', status: 'active', order: 0,
          tasks: [task('a'), task('o', { optional: true, status: 'locked' })] }]));
    assert.doesNotMatch(html, new RegExp(MARK));
    assert.equal(keyShown, false);
});

test('completed and skipped required tasks drop the marker; the progress count still follows the title', async () => {
    const m = manager([
        { aimId: 'x', title: 'X', status: 'active', order: 0,
          tasks: [task('done'), task('gone'), task('open'),
                  task('count', { type: 'collect_items', showProgress: true, targetCount: 3 }),
                  task('o', { optional: true })] }]);
    await m.completeTask('done');
    await m.skipTask('gone');
    const { html } = render(m);
    assert.doesNotMatch(row(html, 'done'), new RegExp(MARK));
    assert.doesNotMatch(row(html, 'gone'), new RegExp(MARK));
    assert.match(row(html, 'gone'), /task-skipped-label">skipped</);
    assert.match(row(html, 'open'), new RegExp(MARK));
    assert.match(row(html, 'count'), new RegExp(`\\*</span> <span class="task-progress">\\(0/3\\)`));
});

test('the marker is presentational: titles and task-complete toasts are unchanged', async () => {
    const m = manager();
    render(m);
    assert.equal(m.getTask('req_a').title, 'Title req_a');
    await m.completeTask('req_a');
    assert.ok(alerts.some(a => a === 'Task Complete: ✓ Title req_a'), alerts.join(' | '));
    assert.ok(!alerts.some(a => a.includes('*')), 'no * in toasts');
});

test('the key hides again once no * is on screen', async () => {
    const m = manager([
        { aimId: 'x', title: 'X', status: 'active', order: 0,
          tasks: [task('a'), task('o', { optional: true })] }]);
    const panel = panelFor(m);
    panel.render(m.getActiveAims());
    assert.ok(panel.content.innerHTML.includes(KEY));
    await m.completeTask('a'); // aim completes; only the optional task was left
    panel.render(m.getActiveAims());
    assert.ok(!panel.content.innerHTML.includes(KEY));
    panel.render([]);
    assert.ok(!panel.content.innerHTML.includes(KEY));
});

test('the stylesheet styles the marker, the dimmer optional text and the key', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/objectives.css'), 'utf8');
    assert.match(css, /\.task-required-mark\s*\{/);
    assert.match(css, /\.task-active\.task-optional\s*\{[^}]*color:/);
    assert.match(css, /\.aim-required-key\s*\{/);
});

test('P3 F11: a lone task with its aim\'s own title is not printed twice; other tasks are unchanged', () => {
    const m = manager([
        { aimId: 'echo', title: 'Check the work phone', status: 'active', order: 0,
          tasks: [task('check_phone', { title: 'Check the work phone' }), task('hidden', { status: 'locked' })] },
        { aimId: 'two', title: 'Cover the finance line', status: 'active', order: 1,
          tasks: [task('cover', { title: 'Cover the finance line' }), task('other')] }
    ]);
    const { html } = render(m);
    assert.ok(!html.includes('data-task-id="check_phone"'), 'the echo row is left out');
    assert.ok(html.includes('data-aim-id="echo"'), 'the aim line still shows');
    assert.ok(html.includes('data-task-id="cover"') && html.includes('data-task-id="other"'), 'an aim with two tasks keeps both');
});
