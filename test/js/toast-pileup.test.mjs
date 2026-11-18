// Toast pile-up control (m09 blind run: four or five toasts stacked over the view).
// A hard ceiling of three timed toasts counting immediate and brief ones, shorter dwell
// with a backlog, low-priority waiting toasts dropped when the line is long, and the
// phone text stack keeping to two when two toasts show. Real notifications.js on jsdom.
// Run with: bin/test-js test/js/toast-pileup.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};
const js = process.env.SWEEP_JS_ROOT || join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');

const dom = new JSDOM('<!doctype html><body><div id="notification-container"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const T = await import(pathToFileURL(join(js, 'systems/notifications.js')).href);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const container = () => document.getElementById('notification-container');
const messages = () => [...container().querySelectorAll('.notification')].map((e) => e._toast.message);
const reset = () => { container().innerHTML = ''; T.clearWaitingToasts(); };
const old = (el, ms) => { el._toast.shownAt = Date.now() - ms; };

test('dwellForBacklog: shortens only timed info and success toasts with a backlog', () => {
    assert.equal(T.dwellForBacklog('info', 5000, 0), 5000);
    assert.equal(T.dwellForBacklog('info', 5000, 1), 5000);
    assert.equal(T.dwellForBacklog('success', 5000, 2), T.SHORT_DWELL_MS);
    assert.equal(T.dwellForBacklog('info', 5000, 4), T.SHORTEST_DWELL_MS);
    assert.equal(T.dwellForBacklog('info', 1000, 4), 1000, 'never lengthened');
    assert.equal(T.dwellForBacklog('error', 5000, 6), 5000);
    assert.equal(T.dwellForBacklog('warning', 5000, 6), 5000);
    assert.equal(T.dwellForBacklog('info', 0, 6), 0, 'stay-until-closed is kept');
});

test('isLowPriorityToast: untitled info and options.low only', () => {
    assert.equal(T.isLowPriorityToast('info', ''), true);
    assert.equal(T.isLowPriorityToast('info', 'Task Complete'), false);
    assert.equal(T.isLowPriorityToast('success', ''), false);
    assert.equal(T.isLowPriorityToast('info', '', { brief: true }), false);
    assert.equal(T.isLowPriorityToast('info', '', { immediate: true }), false);
    assert.equal(T.isLowPriorityToast('success', 'x', { low: true }), true);
});

test('pickLowPriorityDrops: oldest low-priority first, important ones kept', () => {
    const q = [['a', 'info', '', 1, false, {}], ['Flag accepted', 'success', 'Flag', 1, false, {}],
        ['b', 'info', '', 1, false, {}], ['Task', 'info', 'Task Complete', 1, false, {}],
        ['c', 'info', '', 1, false, {}], ['d', 'info', '', 1, false, {}]];
    assert.deepEqual(T.pickLowPriorityDrops(q, 4), [0, 2]);
    assert.deepEqual(T.pickLowPriorityDrops(q.slice(1), 4), [1]);
    const important = [1, 2, 3, 4, 5].map((n) => [`t${n}`, 'success', 'Title', 1, false, {}]);
    assert.deepEqual(T.pickLowPriorityDrops(important, 4), [], 'nothing droppable, nothing lost');
});

test('pickEvictable: oldest readable timed info or success toast, never an error or a fresh one', () => {
    const now = 100000;
    const e = (type, ago, duration = 5000) => ({ type, shownAt: now - ago, duration });
    assert.equal(T.pickEvictable([e('info', 9000), e('info', 5000)], now), null, 'room left');
    const full = [e('error', 9000), e('info', 800), e('success', 4000)];
    assert.equal(T.pickEvictable(full, now), full[2]);
    assert.equal(T.pickEvictable([e('error', 9000), e('info', 800), e('info', 900)], now), null);
    assert.equal(T.pickEvictable([e('info', 9000, 0), e('info', 800), e('info', 900)], now), null, 'persistent ones stay');
});

test('an immediate toast past the ceiling closes the oldest readable toast', async () => {
    reset();
    T.showNotification('a', 'info', 'A', 60000);
    T.showNotification('b', 'info', 'B', 60000);
    const brief = T.showNotification('Done', 'success', '', 60000, { brief: true });
    assert.deepEqual(messages(), ['a', 'b', 'Done'], 'three is allowed');
    for (const el of container().querySelectorAll('.notification')) old(el, 3000);
    T.showNotification('Card saved', 'success', 'Card copied', 60000, { immediate: true });
    await wait(400);   // the 300 ms fade
    assert.deepEqual(messages(), ['b', 'Done', 'Card saved'], 'oldest went, the new one is on screen at once');
    assert.ok(brief);
    reset();
});

test('a fresh toast is not evicted: the ceiling may be passed for a moment instead', () => {
    reset();
    T.showNotification('a', 'info', 'A', 60000);
    T.showNotification('b', 'info', 'B', 60000);
    T.showNotification('Done', 'success', '', 60000, { brief: true });
    T.showNotification('Saved', 'success', 'Copied', 60000, { immediate: true });
    assert.equal(messages().length, 4);
    reset();
});

test('an error is never evicted by an immediate toast', async () => {
    reset();
    T.showNotification('bad', 'error', 'Nope', 60000);
    T.showNotification('b', 'info', 'B', 60000, { brief: true });
    T.showNotification('c', 'info', 'C', 60000, { brief: true });
    for (const el of container().querySelectorAll('.notification')) old(el, 9000);
    T.showNotification('Saved', 'success', 'Copied', 60000, { immediate: true });
    await wait(400);
    assert.ok(messages().includes('bad'));
    assert.ok(!messages().includes('b'));
    reset();
});

test('a long waiting line drops the oldest untitled info lines but keeps titled toasts', () => {
    reset();
    T.showNotification('s1', 'info', 'One', 60000);
    T.showNotification('s2', 'info', 'Two', 60000);
    ['h1', 'h2', 'h3', 'h4', 'h5'].forEach((m) => T.showNotification(m, 'info', '', 5000));
    T.showNotification('Flag accepted', 'success', 'Flag', 5000);
    assert.equal(T.waitingToastCount(), 4, 'capped at four waiting');
    assert.equal(messages().includes('h1'), false);
    reset();
});

test('with a backlog the toasts on screen get a shorter dwell', () => {
    reset();
    T.showNotification('s1', 'info', 'One', 60000);
    T.showNotification('s2', 'info', 'Two', 60000);
    const els = [...container().querySelectorAll('.notification')];
    T.showNotification('w1', 'success', 'Three', 5000);
    T.showNotification('w2', 'success', 'Four', 5000);
    for (const el of els) assert.equal(el._countdownMs, T.SHORT_DWELL_MS);
    reset();
});
