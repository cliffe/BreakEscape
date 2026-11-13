// Objectives: an aim shows as soon as one of its tasks moves (2026-10-03).
// sis01 game 1529 skipped a required-looking task in "Assess Ward 7", so that
// aim never completed and every later aim (each opened by aimCompleted) stayed
// hidden all game although their tasks completed. Now a task that completes,
// makes progress or is unlocked shows its aim; its locked tasks stay hidden.
// A globalVariable condition is a story gate (m05 "Find Out Why") and still
// holds the aim back. The server derives the same on reload
// (Game#objectives_state_for_client, test/controllers/.../reload_persistence_test.rb).
// Run with: node --test test/js/objectives-reveal.test.mjs
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
const panelSrc = readFileSync(join(js, 'ui/objectives-panel.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`);
const { ObjectivesPanel } = await import(dataUrl(panelSrc));

function dispatcher() {
    const emitted = [];
    return { on() {}, emit(name, data) { emitted.push(name); }, emitted };
}

const task = (taskId, extra = {}) => ({ taskId, title: taskId, type: 'custom', status: 'active', ...extra });

// Shaped like sis01: a chain of aims, each opened by the one before
function scenario() {
    return [
        { aimId: 'assess', title: 'Assess Ward 7', status: 'active', order: 0,
          tasks: [task('talk'), task('check_station')] },
        { aimId: 'investigate', title: 'Investigate the Attack', status: 'locked', order: 1,
          unlockCondition: { aimCompleted: 'assess' },
          tasks: [task('meet_ravi'), task('access_siem', { status: 'locked' }), task('brief', { status: 'locked' })] },
        { aimId: 'isolate', title: 'Authorise Network Isolation', status: 'locked', order: 2,
          unlockCondition: { aimCompleted: 'investigate' },
          tasks: [task('signoff')] },
        { aimId: 'both', title: 'Both', status: 'locked', order: 3,
          unlockCondition: { aimsCompleted: ['assess', 'investigate'] },
          tasks: [task('both_first', { status: 'locked' }), task('both_task')] },
        { aimId: 'charts', title: 'Charts', status: 'locked', order: 4,
          unlockCondition: { aimCompleted: 'assess' },
          tasks: [task('collect_charts', { type: 'collect_items', targetItems: ['chart'], targetCount: 2, showProgress: true })] },
        { aimId: 'why', title: 'Find Out Why', status: 'locked', order: 5,
          unlockCondition: { globalVariable: 'suspected', equals: true },
          tasks: [task('keycard'), task('journal')] },
        { aimId: 'finale', title: 'Debrief', status: 'locked', order: 6, missionConclusion: true,
          unlockCondition: { aimCompleted: 'isolate' },
          tasks: [task('debrief')] }
    ];
}

function manager(saved = null) {
    window.gameState = { globalVariables: {}, objectives: saved };
    window.breakEscapeConfig = {}; // offline: serverCompleteTask succeeds without a request
    alerts.length = 0;
    const m = new ObjectivesManager(dispatcher());
    m.initialize(scenario());
    return m;
}

const shown = (m) => m.getActiveAims().map(a => a.aimId);

test('completing a task in a later aim shows that aim while an earlier aim is unfinished', async () => {
    const m = manager();
    assert.deepEqual(shown(m), ['assess']);

    await m.completeTask('meet_ravi');

    assert.deepEqual(shown(m), ['assess', 'investigate']);
    assert.equal(m.getAim('investigate').status, 'active');
    assert.ok(alerts.includes('Mission Updated: New Objective: Investigate the Attack'));
    assert.equal(m.getTask('access_siem').status, 'locked', 'locked tasks are not opened by the reveal');
});

test('an aim whose tasks all complete while revealed early completes and opens the next aim', async () => {
    const m = manager();
    await m.completeTask('signoff'); // isolate: its only task, before investigate is done

    assert.equal(m.getAim('isolate').status, 'completed', 'matches the server, which ignores unlockCondition');
    assert.ok(shown(m).includes('finale'), 'aimCompleted: isolate opens the next aim');
    assert.equal(m.getAim('finale').revealedEarly, false, 'opened properly, not merely shown');
});

test('a task unlocked by ink shows its aim', () => {
    const m = manager();
    m.unlockTask('both_task'); // authored active: no change, no reveal
    assert.ok(!shown(m).includes('both'));

    m.getTask('both_task').status = 'locked';
    m.unlockTask('both_task');
    assert.ok(shown(m).includes('both'));
});

test('partial collect_items progress shows the aim with its count', () => {
    const m = manager();
    m.syncTaskProgress = () => {};
    m.handleItemPickup({ itemType: 'chart', itemId: 'chart_1' });

    assert.equal(m.getTask('collect_charts').currentCount, 1);
    assert.ok(shown(m).includes('charts'));
});

test('partial flag progress shows the aim', () => {
    const m = manager();
    m.handleFlagTasksUpdated({ updatedTasks: ['signoff'] });
    assert.ok(shown(m).includes('isolate'));
});

test('a story gate (globalVariable) keeps the aim hidden until it is unlocked; the work shows then', async () => {
    const m = manager();
    await m.completeTask('keycard');

    assert.ok(!shown(m).includes('why'), 'the list must not name the suspect early');
    assert.equal(m.getTask('keycard').status, 'completed');

    await m.completeTask('journal');
    assert.equal(m.getAim('why').status, 'locked', 'completion is deferred while the gate holds');

    window.gameState.globalVariables.suspected = true;
    m.unlockAim('why');
    assert.equal(m.getAim('why').status, 'completed', 'tasks done while hidden count once it opens');
});

test('a met story gate no longer holds the aim back', async () => {
    const m = manager();
    window.gameState.globalVariables.suspected = true;
    await m.completeTask('keycard');
    assert.ok(shown(m).includes('why'));
});

test('unlockAim on an aim shown early opens its first task without a second notice', async () => {
    const m = manager();
    await m.completeTask('both_task');
    assert.equal(m.getAim('both').revealedEarly, true);
    assert.equal(m.getTask('both_first').status, 'locked');
    alerts.length = 0;

    m.unlockAim('both');

    assert.equal(m.getTask('both_first').status, 'active');
    assert.equal(m.getAim('both').revealedEarly, false);
    assert.ok(!alerts.some(a => a.includes('New Objective')), 'already on show');
    m.unlockAim('both'); // a second call is a no-op as before
});

test('unlockAim still ignores an aim that is already active in the normal way', () => {
    const m = manager();
    m.getTask('talk').status = 'locked';
    m.unlockAim('assess');
    assert.equal(m.getTask('talk').status, 'locked');
});

test('reload: a revealedEarly aim from the server is restored with its marker', () => {
    const m = manager({
        aims: { investigate: { status: 'active', revealedEarly: true } },
        tasks: { meet_ravi: { status: 'completed' } }
    });
    assert.deepEqual(shown(m), ['assess', 'investigate']);
    assert.equal(m.getAim('investigate').revealedEarly, true);
});

test('a missionConclusion aim is concluded by the server response, not by the reveal', async () => {
    const m = manager();
    let concluded = 0;
    m.handleMissionConcluded = () => { concluded++; };
    m.serverCompleteTask = async () => ({ success: true, missionConcluded: false });

    await m.completeTask('debrief');

    assert.equal(m.getAim('finale').status, 'completed');
    assert.equal(concluded, 0, 'only missionConcluded:true from the server ends the mission');
});

test('panel: a revealed aim shows its done and active tasks, never its locked ones', async () => {
    const m = manager();
    await m.completeTask('meet_ravi');

    const panel = Object.create(ObjectivesPanel.prototype);
    Object.assign(panel, { content: { innerHTML: '', querySelector: () => null },
                           aimCollapsed: {}, aimStatus: {}, manager: m });
    panel.escapeHtml = (s) => String(s);
    panel.render(m.getActiveAims());
    const html = panel.content.innerHTML;

    assert.match(html, /data-aim-id="investigate"/);
    assert.match(html, /task-completed" data-task-id="meet_ravi"/);
    assert.doesNotMatch(html, /data-task-id="access_siem"/);
    assert.doesNotMatch(html, /data-aim-id="isolate"/);
});
