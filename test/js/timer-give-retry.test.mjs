// Declared grants (docs/achitechture/DECLARED_GRANTS_PLAN.md §2.5): a timer's give_item
// is only done once the server has answered. applyActions returns the give promises;
// the dispatcher marks the timer fired when every give settles with anything but a
// network error, retries a lost give alone after 1 s, 3 s and 10 s, and leaves the
// timer unfired (for the next load) if the last retry fails too.
// Run with: node test/js/timer-give-retry.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = {
    gameState: { globalVariables: {} },
    lockRef: (item) => item?.opens_lock,
    eventDispatcher: { on() {}, off() {}, emit() {} }
};

const actionsUrl = dataUrl(readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../utils/escape-html.js'").join(`'${dataUrl('export const escapeHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'../utils/author-html.js'").join(`'${dataUrl('export const authorHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal() {}')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact() {} export function readyToastText() { return ""; } export function readyToastTitle() { return ""; }')}'`));
const { applyActions } = await import(actionsUrl);
const dispatcherSrc = readFileSync(join(js, 'ui/scenario-timer-dispatcher.js'), 'utf8')
    .split("'../systems/apply-actions.js'").join(`'${actionsUrl}'`);
const { ScenarioTimerDispatcher } = await import(dataUrl(dispatcherSrc));

const silence = () => {
    const saved = [console.log, console.warn];
    console.log = () => {}; console.warn = () => {};
    return () => { [console.log, console.warn] = saved; };
};
// Let promise chains run (the mocked clock only drives setTimeout)
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

const GIVE = { type: 'give_item', item: { type: 'pc', id: 'remote_x', name: 'Remote X' } };
const OTHER = { type: 'emit_event', event_name: 'other_ran' };

// addToInventory answers from a queue of results ('error' or anything else)
function inventory(results) {
    const calls = [];
    window.addToInventory = (sprite) => {
        calls.push(sprite.scenarioData.id);
        const reason = results.length ? results.shift() : 'added';
        return Promise.resolve({ ok: reason === 'added' || reason === 'already', reason });
    };
    return calls;
}

function dispatcher(actions = [GIVE]) {
    window.gameState.globalVariables = { foothold: true };
    return new ScenarioTimerDispatcher({ timers: [{ id: 'grant', startOnGlobal: 'foothold', delayMs: 300, actions }] });
}

test('applyActions returns one promise per give_item, and [] otherwise', async () => {
    const restore = silence();
    try {
        inventory([]);
        assert.deepEqual(applyActions([]), []);
        assert.deepEqual(applyActions(undefined), []);
        assert.deepEqual(applyActions([{ type: 'hint', message: 'x' }]), []);
        const gives = applyActions([GIVE, { type: 'hint', message: 'x' }, GIVE]);
        assert.equal(gives.length, 2);
        assert.deepEqual((await Promise.all(gives)).map(r => r.reason), ['added', 'added']);
    } finally { restore(); }
});

for (const reason of ['added', 'already', 'rejected', 'invalid']) {
    test(`a give settling '${reason}' marks the timer fired once`, async () => {
        const restore = silence();
        try {
            const calls = inventory([reason]);
            const d = dispatcher();
            d.update(Date.now() + 1000);
            assert.equal(d.isDone('grant'), false, 'not fired until the server answers');
            d.update(Date.now() + 2000);
            await flush();
            assert.equal(d.isDone('grant'), true);
            assert.deepEqual(d.exportState().fired, ['grant']);
            assert.equal(calls.length, 1);
        } finally { restore(); }
    });
}

test('a network error retries the give alone at 1 s, 3 s and 10 s; other actions run once', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    const restore = silence();
    try {
        let otherRuns = 0;
        window.eventDispatcher.emit = (name) => { if (name === 'other_ran') otherRuns++; };
        const calls = inventory(['error', 'error', 'error', 'added']);
        const d = dispatcher([OTHER, GIVE]);
        d.update(Date.now() + 1000);
        await flush();
        assert.equal(calls.length, 1);
        d.update(Date.now() + 2000); // in flight: not fired again
        assert.equal(calls.length, 1);

        mock.timers.tick(999); await flush();
        assert.equal(calls.length, 1);
        mock.timers.tick(1); await flush();
        assert.equal(calls.length, 2, 'first retry after 1 s');
        mock.timers.tick(3000); await flush();
        assert.equal(calls.length, 3, 'second retry after 3 s');
        assert.equal(d.isDone('grant'), false);
        mock.timers.tick(10000); await flush();
        assert.equal(calls.length, 4, 'third retry after 10 s');
        assert.equal(d.isDone('grant'), true, 'fired once the retry is accepted');
        assert.equal(otherRuns, 1, 'the timer\'s other actions are not re-run');
    } finally {
        restore();
        window.eventDispatcher.emit = () => {};
        mock.timers.reset();
    }
});

test('after the last retry fails the timer stays unfired, stops retrying, and a reload re-fires it', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    const restore = silence();
    try {
        const calls = inventory(['error', 'error', 'error', 'error']);
        const d = dispatcher();
        d.update(Date.now() + 1000);
        await flush();
        for (const ms of [1000, 3000, 10000]) { mock.timers.tick(ms); await flush(); }
        assert.equal(calls.length, 4);
        assert.equal(d.isDone('grant'), false, 'left unfired');
        mock.timers.tick(60000); await flush();
        d.update(Date.now() + 120000);
        await flush();
        assert.equal(calls.length, 4, 'no more retries on this page');

        const saved = d.exportState();
        assert.ok(!saved.fired.includes('grant'));
        assert.ok('grant' in saved.started, 'still started, so the next load resumes it');

        // Reload with the server back: the restored dispatcher fires the give again
        inventory([]);
        const calls2 = inventory(['added']);
        const reloaded = new ScenarioTimerDispatcher(
            { timers: [{ id: 'grant', startOnGlobal: 'foothold', delayMs: 300, actions: [GIVE] }] },
            { saved }
        );
        reloaded.update(Date.now() + 1000);
        await flush();
        assert.equal(calls2.length, 1);
        assert.equal(reloaded.isDone('grant'), true);
    } finally { restore(); mock.timers.reset(); }
});

test('destroy() cancels a pending retry', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    const restore = silence();
    try {
        const calls = inventory(['error', 'added']);
        const d = dispatcher();
        d.update(Date.now() + 1000);
        await flush();
        d.destroy();
        mock.timers.tick(20000); await flush();
        assert.equal(calls.length, 1, 'no retry after destroy');
        assert.equal(d.isDone('grant'), false);
    } finally { restore(); mock.timers.reset(); }
});

test('a timer with no give_item still fires at once', () => {
    const restore = silence();
    try {
        const d = dispatcher([OTHER]);
        d.update(Date.now() + 1000);
        assert.equal(d.isDone('grant'), true);
    } finally { restore(); }
});
