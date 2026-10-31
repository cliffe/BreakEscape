// The ending warning (systems/ending-check.js): before a story's ending fires, the player is
// told which optional objectives are still open and can end now or keep going.
// Covers: which objectives count (visible, optional, open); the opt-out and the replay skip;
// the modal's words and buttons; the answer being remembered; a held ending (panel button,
// ending by itself); the ink tag `# ending_check`; the aim route in the objectives manager;
// the credits route in scenario-music-events.js.
// Real sources run in jsdom. Run with: node --test test/js/ending-check.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'ending-check-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['systems/ending-check.js', 'utils/display-dashes.js', 'systems/objectives-manager.js',
    'ui/objectives-panel.js', 'utils/room-display-name.js', 'utils/global-condition.js', 'utils/portrait-variants.js',
    'systems/combat-input.js', 'minigames/helpers/chat-helpers.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const quiet = (k) => { console[k] = () => {}; };
['log', 'info', 'warn', 'debug'].forEach(quiet);
window.gameState = { globalVariables: {} };
window.NPCGameBridge = {};

const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const E = await imp('systems/ending-check.js');
const { ObjectivesManager } = await imp('systems/objectives-manager.js');
const { ObjectivesPanel } = await imp('ui/objectives-panel.js');
const { processGameActionTags } = await imp('minigames/helpers/chat-helpers.js');

const task = (taskId, title, extra = {}) => ({ taskId, title, type: 'custom', status: 'active', ...extra });
const aim = (aimId, tasks, extra = {}) => ({ aimId, title: aimId, status: 'active', order: 0, tasks, ...extra });

function manager(aims) {
    const m = new ObjectivesManager({ on() {}, emit() {} });
    m.initialize(JSON.parse(JSON.stringify(aims)));
    return m;
}

const SCENARIO = [
    aim('main', [task('a', 'Do the work'), task('opt1', 'Find the spare key', { optional: true }),
        task('opt2', 'Read the notice', { optional: true }), task('opt_locked', 'A hidden extra', { optional: true, status: 'locked' })]),
    aim('later', [task('opt_hidden', 'Not unlocked yet', { optional: true })], { status: 'locked' }),
    aim('end', [task('final', 'File your debrief')], { missionConclusion: true })
];

const overlay = () => document.getElementById(E.ENDING_CHECK_ID);
const click = (id) => document.getElementById(id).click();
const key = (k) => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true }));
const tick = () => new Promise((r) => setTimeout(r, 0));

test.beforeEach(() => {
    E._resetEndingCheck();
    window.breakEscapeConfig = {};
    window.player = { disableMovement: false };
    window.objectivesManager = manager(SCENARIO);
});

test('openOptionalObjectives lists visible, open, optional tasks only', () => {
    const open = E.openOptionalObjectives(window.objectivesManager);
    assert.deepEqual(open.map((o) => o.taskId), ['opt1', 'opt2']);
    assert.deepEqual(open.map((o) => o.title), ['Find the spare key', 'Read the notice']);
    window.objectivesManager.taskIndex.opt1.status = 'completed';
    window.objectivesManager.taskIndex.opt2.status = 'skipped';
    assert.deepEqual(E.openOptionalObjectives(window.objectivesManager), []);
});

test('the warning is off with endingCheck false or on a replayed ending', async () => {
    assert.equal(E.endingCheckEnabled({}), true);
    assert.equal(E.endingCheckEnabled({ endingCheck: false }), false);
    assert.equal(E.endingCheckEnabled({ missionConcludedAt: '2026-10-31T10:00:00Z' }), false);
    window.breakEscapeConfig = { endingCheck: false };
    assert.equal(await E.confirmEnding({ reason: 'credits' }), true);
    assert.equal(overlay(), null);
    window.breakEscapeConfig = { missionConcludedAt: '2026-10-31T10:00:00Z' };
    assert.equal(await E.confirmEnding({ reason: 'credits' }), true);
    assert.equal(overlay(), null);
});

test('no modal when nothing optional is open', async () => {
    window.objectivesManager = manager([aim('main', [task('a', 'Do the work')])]);
    assert.equal(E.endingNeedsAnswer(), false);
    assert.equal(await E.confirmEnding(), true);
    assert.equal(overlay(), null);
});

test('the modal names what is open, and Keep going resolves false', async () => {
    const answer = E.confirmEnding({ reason: 'credits' });
    assert.ok(overlay());
    assert.match(overlay().querySelector('.ending-check-intro').textContent, /^You have done what the mission needs\. 2 optional objectives are still open:$/);
    assert.deepEqual([...overlay().querySelectorAll('li')].map((li) => li.textContent), ['Find the spare key', 'Read the notice']);
    assert.deepEqual([...overlay().querySelectorAll('button')].map((b) => b.textContent), ['Keep going', 'End the mission now']);
    assert.equal(window.player.disableMovement, true);
    click('ending-check-keep');
    assert.equal(await answer, false);
    assert.equal(overlay(), null);
    assert.equal(window.player.disableMovement, false);
});

test('one open objective reads in the singular', async () => {
    window.objectivesManager.taskIndex.opt2.status = 'completed';
    const answer = E.confirmEnding();
    assert.match(overlay().querySelector('.ending-check-intro').textContent, /1 optional objective is still open:/);
    click('ending-check-end');
    await answer;
});

test('player copy has no em dash', () => {
    for (const text of [E.HEADING, E.END_LABEL, E.KEEP_LABEL, E.PANEL_BUTTON_LABEL, E.introText(1), E.introText(3)]) {
        assert.doesNotMatch(text, /[—–]/);
    }
});

test('Escape means keep going, and End the mission now resolves true and is remembered', async () => {
    const first = E.confirmEnding();
    key('Escape');
    assert.equal(await first, false);

    const second = E.confirmEnding();
    click('ending-check-end');
    assert.equal(await second, true);
    // Asked again for the same objectives (the credits after the tag): no second modal
    assert.equal(E.endingNeedsAnswer(), false);
    assert.equal(await E.confirmEnding(), true);
    assert.equal(overlay(), null);
});

test('a new optional objective opening after End now is asked about', async () => {
    const first = E.confirmEnding();
    click('ending-check-end');
    await first;
    window.objectivesManager.taskIndex.opt_locked.status = 'active';
    assert.equal(E.endingNeedsAnswer(), true);
    const again = E.confirmEnding();
    assert.ok(overlay());
    click('ending-check-keep');
    assert.equal(await again, false);
});

test('two askers share one modal', async () => {
    const a = E.confirmEnding();
    const b = E.confirmEnding();
    assert.equal(document.querySelectorAll(`#${E.ENDING_CHECK_ID}`).length, 1);
    click('ending-check-end');
    assert.deepEqual([await a, await b], [true, true]);
});

test('a held ending: the panel offers End the mission, and ending it does not ask again', async () => {
    let ended = 0;
    E.holdEnding(() => { ended += 1; });
    assert.equal(E.hasHeldEnding(), true);
    const panel = new ObjectivesPanel(window.objectivesManager);
    window.endingCheck = { hasHeld: E.hasHeldEnding, endHeld: E.endHeldEnding };
    try {
        panel.render(window.objectivesManager.getActiveAims());
        const button = panel.content.querySelector('.objectives-end-button');
        assert.ok(button);
        assert.equal(button.textContent, E.PANEL_BUTTON_LABEL);
        button.click();
        assert.equal(ended, 1);
        assert.equal(E.hasHeldEnding(), false);
        assert.equal(E.endingNeedsAnswer(), false, 'the open objectives were agreed to');
    } finally {
        panel.container.remove();
        delete window.endingCheck;
    }
});

test('a held ending ends by itself once nothing optional is open', () => {
    let ended = 0;
    E.holdEnding(() => { ended += 1; }, {}, { manager: window.objectivesManager });
    window.objectivesManager.taskIndex.opt1.status = 'completed';
    window.objectivesManager.notifyListeners();
    assert.equal(ended, 0, 'one objective is still open');
    window.objectivesManager.taskIndex.opt2.status = 'completed';
    window.objectivesManager.notifyListeners();
    assert.equal(ended, 1);
    assert.equal(E.hasHeldEnding(), false);
});

// --- the ink tag -------------------------------------------------------------------------------

test('# ending_check: Keep going skips the rest of the line\'s tags', async () => {
    window.endingCheck = { confirm: E.confirmEnding };
    const events = [];
    window.eventDispatcher = { emit: (name) => events.push(name) };
    try {
        const run = processGameActionTags(['ending_check', 'complete_task:final'], {});
        await tick();
        assert.ok(overlay());
        click('ending-check-keep');
        const results = await run;
        assert.deepEqual(results.map((r) => r.action), ['ending_check']);
        assert.deepEqual(events, [], 'complete_task never ran');
    } finally {
        delete window.endingCheck;
        delete window.eventDispatcher;
    }
});

test('# ending_check: End the mission now lets the rest of the tags run', async () => {
    window.endingCheck = { confirm: E.confirmEnding };
    const events = [];
    window.eventDispatcher = { emit: (name, data) => events.push([name, data.taskId]) };
    try {
        const run = processGameActionTags(['ending_check', 'complete_task:final'], {});
        await tick();
        click('ending-check-end');
        const results = await run;
        assert.deepEqual(results.map((r) => r.action), ['ending_check', 'complete_task']);
        assert.deepEqual(events, [['task_completed_by_npc', 'final']]);
    } finally {
        delete window.endingCheck;
        delete window.eventDispatcher;
    }
});

test('# ending_check with nothing open (or the opt-out) runs straight through', async () => {
    window.endingCheck = { confirm: E.confirmEnding };
    const events = [];
    window.eventDispatcher = { emit: (name) => events.push(name) };
    window.breakEscapeConfig = { endingCheck: false };
    try {
        const results = await processGameActionTags(['ending_check', 'complete_task:final'], {});
        assert.equal(results.length, 2);
        assert.equal(overlay(), null);
        assert.deepEqual(events, ['task_completed_by_npc']);
    } finally {
        delete window.endingCheck;
        delete window.eventDispatcher;
    }
});

test('# ending_check with no module loaded is a no-op', async () => {
    delete window.endingCheck;
    const results = await processGameActionTags(['ending_check'], {});
    assert.equal(results[0].success, true);
});

// --- the aim route -----------------------------------------------------------------------------

test('wouldConcludeMission: the last required task of a conclusion aim, with concludeRequires done', () => {
    const m = manager([
        aim('work', [task('gate', 'Gate')]),
        aim('end', [task('final', 'Debrief'), task('extra', 'Extra', { optional: true })],
            { missionConclusion: true, concludeRequires: { tasksCompleted: ['gate'] } })
    ]);
    assert.equal(m.wouldConcludeMission(m.taskIndex.final), false, 'gate task not done');
    m.taskIndex.gate.status = 'completed';
    assert.equal(m.wouldConcludeMission(m.taskIndex.final), true);
    assert.equal(m.wouldConcludeMission(m.taskIndex.extra), false, 'not a conclusion aim task of the last required kind');
    assert.equal(m.wouldConcludeMission(m.taskIndex.gate), false, 'not in a conclusion aim');
});

test('completeTask on the concluding task waits for the answer; Keep going holds it, the button finishes it', async () => {
    const m = manager(SCENARIO);
    window.objectivesManager = m;
    window.endingCheck = {
        needsAnswer: E.endingNeedsAnswer, confirm: E.confirmEnding, hold: E.holdEnding,
        hasHeld: E.hasHeldEnding, endHeld: E.endHeldEnding
    };
    const posted = [];
    m.serverCompleteTaskWithRetry = async (id) => { posted.push(id); return { success: true, missionConcluded: true }; };
    m.handleMissionConcluded = () => {};
    m.showTaskCompleteNotification = () => {};
    try {
        m.taskIndex.a.status = 'completed';
        const run = m.completeTask('final');
        await tick();
        assert.ok(overlay(), 'asked before posting');
        assert.deepEqual(posted, []);
        click('ending-check-keep');
        await run;
        assert.deepEqual(posted, [], 'the task was not posted');
        assert.equal(m.taskIndex.final.status, 'active');
        assert.equal(E.hasHeldEnding(), true);

        E.endHeldEnding();
        await tick();
        await tick();
        assert.deepEqual(posted, ['final'], 'End the mission posts the task, without a second question');
        assert.equal(overlay(), null);
    } finally {
        delete window.endingCheck;
    }
});

test('completeTask on an ordinary task never asks', async () => {
    const m = manager(SCENARIO);
    window.objectivesManager = m;
    window.endingCheck = { needsAnswer: E.endingNeedsAnswer, confirm: E.confirmEnding, hold: E.holdEnding };
    const posted = [];
    m.serverCompleteTaskWithRetry = async (id) => { posted.push(id); return { success: true }; };
    m.showTaskCompleteNotification = () => {};
    try {
        await m.completeTask('a');
        assert.deepEqual(posted, ['a']);
        assert.equal(overlay(), null);
    } finally {
        delete window.endingCheck;
    }
});
