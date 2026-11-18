// Toast pile-up control (m09 blind run: four or five toasts stacked over the view), after the
// R1 review: only a toast raised with options.low is ever dropped, cut short or closed early;
// teaching lines, hints, verbatim and whole toasts wait their turn with their full time; every
// timed toast pauses on hover and focus. Real notifications.js on jsdom.
// Run with: bin/test-js test/js/toast-pileup.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};
const js = process.env.SWEEP_JS_ROOT || join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');

const dom = new JSDOM('<!doctype html><body><div id="notification-container"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const T = await import(pathToFileURL(join(js, 'systems/notifications.js')).href);
const L = await import(pathToFileURL(join(js, 'systems/bark-lifetime.js')).href);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const container = () => document.getElementById('notification-container');
const els = () => [...container().querySelectorAll('.notification')];
const messages = () => els().map((e) => e._toast.message);
const reset = () => { container().innerHTML = ''; T.clearWaitingToasts(); };
const old = (el, ms) => { el._toast.shownAt = Date.now() - ms; };
const live = () => document.getElementById('toast-live-polite')?.textContent;

test('dwellForBacklog: shortens only low-priority timed toasts with a backlog', () => {
    assert.equal(T.dwellForBacklog('info', 5000, 0, true), 5000);
    assert.equal(T.dwellForBacklog('info', 5000, 1, true), 5000);
    assert.equal(T.dwellForBacklog('success', 5000, 2, true), T.SHORT_DWELL_MS);
    assert.equal(T.dwellForBacklog('info', 5000, 4, true), T.SHORTEST_DWELL_MS);
    assert.equal(T.dwellForBacklog('info', 1000, 4, true), 1000, 'never lengthened');
    assert.equal(T.dwellForBacklog('error', 5000, 6, true), 5000);
    assert.equal(T.dwellForBacklog('info', 0, 6, true), 0, 'stay-until-closed is kept');
    assert.equal(T.dwellForBacklog('info', 9000, 6), 9000, 'not marked low: never shortened');
    assert.equal(T.dwellForBacklog('info', 9000, 6, false, 'a hint'), 9000);
    const long = Array(20).fill('word').join(' ');
    assert.equal(T.dwellForBacklog('info', 9000, 6, true, long), 5000, 'floor of 250 ms a word');
});

test('isLowPriorityToast: only an explicit options.low, never teaching or copy-able content', () => {
    assert.equal(T.isLowPriorityToast('info', ''), false, 'untitled info is not low any more');
    assert.equal(T.isLowPriorityToast('info', '', { low: true }), true);
    assert.equal(T.isLowPriorityToast('success', 'x', { low: true }), true);
    assert.equal(T.isLowPriorityToast('error', '', { low: true }), false);
    for (const o of ['brief', 'immediate', 'whole', 'verbatim', 'hint', 'keep']) {
        assert.equal(T.isLowPriorityToast('info', '', { low: true, [o]: true }), false, o);
    }
});

test('pickLowPriorityDrops: only low ones go, a long line of hints loses nothing', () => {
    const low = (m) => [m, 'info', '', 1, false, { low: true }];
    const hint = (m) => [m, 'info', '', 1, false, {}];
    const q = [low('a'), hint('h1'), low('b'), hint('h2'), low('c'), hint('h3')];
    assert.deepEqual(T.pickLowPriorityDrops(q, 4), [0, 2]);
    assert.deepEqual(T.pickLowPriorityDrops([1, 2, 3, 4, 5, 6].map((n) => hint('t' + n)), 4), [], 'nothing lost');
    const teach = [1, 2, 3, 4, 5].map((n) => [`t${n}`, 'info', '', 1, false, { whole: true, low: true }]);
    assert.deepEqual(T.pickLowPriorityDrops(teach, 4), [], 'whole is never dropped even if marked low');
});

test('pickEvictable: a low readable toast only; not hinted, held or stepped aside', () => {
    const now = 100000;
    const e = (o) => ({ type: 'info', shownAt: now - 5000, duration: 5000, low: true, ...o });
    assert.equal(T.pickEvictable([e({}), e({})], now), null, 'room left');
    const three = (first) => [first, e({}), e({})];
    const f = e({});
    assert.equal(T.pickEvictable(three(f), now), f);
    assert.equal(T.pickEvictable(three(e({ low: false })).map((x, i) => i ? e({ low: false }) : x), now), null, 'not low');
    assert.equal(T.pickEvictable([e({ held: true }), e({ yieldLeft: 3000 }), e({ shownAt: now - 800 })], now), null);
    assert.equal(T.pickEvictable([e({ type: 'error' }), e({ duration: 0 }), e({ shownAt: now - 800 })], now), null);
});

test('an immediate toast past the ceiling closes the oldest readable low toast', async () => {
    reset();
    T.showNotification('a', 'info', '', 60000, { low: true });
    T.showNotification('b', 'info', '', 60000, { low: true });
    T.showNotification('Done', 'success', '', 60000, { brief: true });
    assert.deepEqual(messages(), ['a', 'b', 'Done']);
    els().forEach((el) => old(el, 3000));
    T.showNotification('Card saved', 'success', 'Card copied', 60000, { immediate: true });
    await wait(400);
    assert.deepEqual(messages(), ['b', 'Done', 'Card saved']);
    reset();
});

test('M1/B2: eviction never closes a verbatim, whole, hint or unmarked toast', async () => {
    reset();
    T.showNotification('p4ss word', 'info', '', 60000, { verbatim: true, low: true });
    T.showNotification('teach line', 'info', '', 60000, { whole: true });
    T.showNotification('Done', 'success', '', 60000, { brief: true });
    els().forEach((el) => old(el, 5000));
    T.showNotification('Saved', 'success', 'Copied', 60000, { immediate: true });
    await wait(400);
    assert.deepEqual(messages(), ['p4ss word', 'teach line', 'Done', 'Saved'], 'all kept; the ceiling is soft');
    reset();
});

test('M2: a toast hud-lanes stepped aside is not evicted', async () => {
    reset();
    T.showNotification('a', 'info', '', 60000, { low: true });
    T.showNotification('b', 'info', '', 60000, { low: true });
    T.showNotification('Done', 'success', '', 60000, { brief: true });
    const [a, b] = els();
    els().forEach((el) => old(el, 5000));
    a._onLaneYield(true);
    assert.notEqual(a._yieldLeft, null);
    T.showNotification('Saved', 'success', 'Copied', 60000, { immediate: true });
    await wait(400);
    assert.ok(messages().includes('a'), 'the stepped-aside toast stays');
    assert.ok(!messages().includes('b'), 'the next readable low one went');
    reset();
});

test('B1: a long line of hints and teach lines loses none and shortens none', async () => {
    reset();
    T.showNotification('s1', 'info', 'One', 60000);
    T.showNotification('s2', 'info', 'Two', 60000);
    const first = els();
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((m) => T.showNotification(m, 'info', '', 12000));
    T.showNotification('teach', 'info', '', 8000, { whole: true });
    assert.equal(T.waitingToastCount(), 7, 'every one waits its turn');
    for (const el of first) assert.equal(el._countdownMs, 60000, 'shown toasts keep their time');
    reset();
});

test('B1: a long line of low asides drops the oldest low ones and announces each once', async () => {
    reset();
    const heard = [];
    const mo = new dom.window.MutationObserver(() => { const t = live(); if (t) heard.push(t); });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
    T.showNotification('s1', 'info', 'One', 60000);
    T.showNotification('s2', 'info', 'Two', 60000);
    ['aside one', 'aside two', 'aside three', 'aside four', 'aside five'].forEach((m) => T.showNotification(m, 'info', '', 5000, { low: true }));
    T.showNotification('Flag accepted', 'success', 'Flag', 5000);
    assert.equal(T.waitingToastCount(), 4);
    await wait(50);
    mo.disconnect();
    assert.ok(heard.includes('aside one') && heard.includes('aside two'), `M3: every dropped line reached the live region (${heard})`);
    assert.equal(heard.filter((h) => h === 'aside one').length, 1, 'once');
    reset();
});

test('B2: low toasts on screen get a shorter dwell with a backlog; hints do not', () => {
    reset();
    T.showNotification('low', 'info', '', 60000, { low: true });
    T.showNotification('hint', 'info', '', 60000);
    const [lowEl, hintEl] = els();
    T.showNotification('w1', 'success', 'Three', 5000);
    T.showNotification('w2', 'success', 'Four', 5000);
    assert.equal(lowEl._countdownMs, T.SHORT_DWELL_MS);
    assert.equal(hintEl._countdownMs, 60000);
    reset();
});

test('m4: a low toast that waited its turn is not shortened again', async () => {
    reset();
    T.showNotification('s1', 'info', 'One', 60000);
    T.showNotification('s2', 'info', 'Two', 60000);
    T.showNotification('late', 'info', '', 9000, { low: true });
    els()[0]._toast.shownAt = 0;
    T.removeNotification(els()[0]);
    await wait(400);
    const late = els().find((e) => e._toast.message === 'late');
    assert.ok(late);
    assert.equal(late._toast.duration, 9000);
    reset();
});

test('B2: hover and focus pause the countdown and it carries on with the time left', async () => {
    reset();
    const el = T.showNotification('read me slowly', 'info', '', 700);
    await wait(250);
    el.dispatchEvent(new dom.window.Event('mouseenter'));
    assert.ok(el._pausedLeft > 0 && el._pausedLeft < 700);
    const left = el._pausedLeft;
    await wait(900);
    assert.equal(el._toast.closing, undefined, 'still up well past its time');
    el.dispatchEvent(new dom.window.Event('mouseleave'));
    assert.equal(el._pausedLeft, null);
    await wait(left + 700);
    assert.equal(el._toast.closing, true, 'closes after the rest of its time');
    reset();
    const el2 = T.showNotification('focus me', 'info', '', 400);
    el2.dispatchEvent(new dom.window.Event('focusin'));
    el2.dispatchEvent(new dom.window.Event('mouseenter'));
    el2.dispatchEvent(new dom.window.Event('mouseleave'));
    await wait(700);
    assert.equal(el2._toast.closing, undefined, 'focus still holds it');
    el2.dispatchEvent(new dom.window.Event('focusout'));
    await wait(1100);
    assert.equal(el2._toast.closing, true);
    reset();
});

test('B2: the pointer over a click-through toast body pauses it, by position', async () => {
    reset();
    const el = T.showNotification('under the pointer', 'info', '', 600);
    el.getBoundingClientRect = () => ({ left: 10, right: 110, top: 10, bottom: 60, width: 100, height: 50 });
    T.updateHoverFromPointer(50, 30);
    assert.ok(el._pausedLeft > 0);
    await wait(900);
    assert.equal(el._toast.closing, undefined, 'held past its time');
    T.updateHoverFromPointer(500, 500);
    assert.equal(el._pausedLeft, null);
    await wait(1200);
    assert.equal(el._toast.closing, true);
    reset();
});

test('M4: toasts held behind a panel and released together all appear, full time, in order', async () => {
    reset();
    window.MinigameFramework = { currentMinigame: {} };
    T.showNotification('teach: keep this key safe', 'info', '', 8000, { whole: true });
    ['hint 1', 'hint 2', 'hint 3'].forEach((m) => T.showNotification(m, 'info', '', 7000));
    T.showNotification('find: creds saved', 'info', '', 7000, { whole: true });
    T.showNotification('aside', 'info', '', 2500, { low: true });
    assert.deepEqual(messages(), [], 'held behind the panel');
    delete window.MinigameFramework;
    await wait(700);
    const seen = new Set(messages());
    // shown now or waiting: the line holds the rest, none dropped (only the aside is droppable)
    assert.equal(seen.size + T.waitingToastCount(), 6);
    const durations = els().filter((e) => e._toast.message !== 'aside').map((e) => e._countdownMs);
    for (const d of durations) assert.ok(d >= 7000, `full dwell kept (${d})`);
    while (T.waitingToastCount() > 0 && els().length) { els().forEach((e) => T.removeNotification(e)); await wait(450); }
    reset();
});

test('M4: phone compact mode (one place) queues hints with their full time', () => {
    reset();
    document.body.classList.add('hud-compact');
    T.showNotification('first', 'info', '', 9000);
    ['second', 'third', 'fourth', 'fifth', 'sixth'].forEach((m) => T.showNotification(m, 'info', '', 9000));
    assert.equal(els().length, 1);
    assert.equal(T.waitingToastCount(), 5, 'nothing dropped on a phone');
    reset();
    document.body.classList.remove('hud-compact');
});

test('M4/M5: bark budget counts timed toasts only and keeps at least one text', () => {
    assert.equal(L.barkMaxVisible(0), 3);
    assert.equal(L.barkMaxVisible(1), 3);
    assert.equal(L.barkMaxVisible(2), 2);
    assert.equal(L.barkMaxVisible(3), 1);
    assert.equal(L.barkMaxVisible(9), 1);
    reset();
    T.showNotification('stay open', 'info', '', 0);
    T.showNotification('stay open too', 'info', '', 0);
    T.showNotification('timed', 'info', '', 9000);
    assert.equal(window.shownToastCount(), 1, 'stay-open toasts are not counted');
    assert.equal(L.barkMaxVisible(window.shownToastCount()), 3, 'so the phone stack keeps its three');
    reset();
});
