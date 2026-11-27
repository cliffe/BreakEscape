// Phone thread stays on its last bubble while the choices panel fills in or changes
// height, and while the window resizes; the player scrolling up is left alone
// (engine round 7, m06 M2).
// Run with: node --test test/js/phone-chat-bottom-pin.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '../../public/break_escape/js/minigames/phone-chat');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const { createBottomPin, isAtBottom } =
    await import(dataUrl(readFileSync(join(dir, 'phone-chat-scroll.js'), 'utf8')));

// A scrolling box: scrollTop is clamped like a browser's
function fakeThread({ content = 1000, height = 300 } = {}) {
    const listeners = {};
    const el = {
        nodeType: 1, children: [], scrollHeight: content, clientHeight: height, _top: 0,
        get scrollTop() { return this._top; },
        set scrollTop(v) { this._top = Math.max(0, Math.min(v, this.scrollHeight - this.clientHeight)); listeners.scroll?.(); },
        scrollTo({ top }) { this._smoothTarget = top; },   // a smooth scroll still under way
        addEventListener(t, fn) { listeners[t] = fn; },
        removeEventListener(t) { delete listeners[t]; },
        fire(t) { listeners[t]?.(); },
        listeners
    };
    return el;
}

function fakeObservers() {
    const made = { ro: [], mo: [] };
    class RO { constructor(cb) { this.cb = cb; this.watched = []; made.ro.push(this); } observe(e) { this.watched.push(e); } disconnect() { this.off = true; } fire() { this.cb([]); } }
    class MO { constructor(cb) { this.cb = cb; made.mo.push(this); } observe(e) { this.target = e; } disconnect() { this.off = true; } }
    return { made, RO, MO };
}

test('isAtBottom allows a few px of rounding', () => {
    assert.equal(isAtBottom({ scrollTop: 700, clientHeight: 300, scrollHeight: 1000 }), true);
    assert.equal(isAtBottom({ scrollTop: 697, clientHeight: 300, scrollHeight: 1000 }), true);
    assert.equal(isAtBottom({ scrollTop: 674, clientHeight: 300, scrollHeight: 1000 }), false);
    assert.equal(isAtBottom({ scrollTop: 0, clientHeight: 300, scrollHeight: 200 }), true);
});

test('the choices panel taking height after the scroll started puts the thread back at the bottom', () => {
    const thread = fakeThread();
    const { made, RO, MO } = fakeObservers();
    let t = 0;
    const pin = createBottomPin(thread, { watch: [{ nodeType: 1 }], ResizeObserver: RO, MutationObserver: MO, now: () => t });
    pin.pin(true);                       // smooth scroll aimed at the old height
    assert.equal(thread._smoothTarget, 1000);
    thread.clientHeight = 160;           // choices fill in under the thread (the M2 case)
    thread.scrollTop = 814;              // the smooth scroll ends 26 px short
    t = 100;                             // its scroll events are not the player's
    assert.equal(pin.isPinned(), true);
    made.ro[0].fire();                   // the thread's size changed
    assert.equal(thread.scrollTop, 840);
    assert.equal(isAtBottom(thread), true);
});

test('a window resize keeps a pinned thread on its last bubble', () => {
    const thread = fakeThread();
    const { made, RO, MO } = fakeObservers();
    const pin = createBottomPin(thread, { ResizeObserver: RO, MutationObserver: MO, now: () => 0 });
    pin.pin(false);
    assert.equal(thread.scrollTop, 700);
    thread.clientHeight = 150;
    made.ro[0].fire();
    assert.equal(thread.scrollTop, 850);
});

test('the player scrolling up is not undone by a resize; scrolling back down pins again', () => {
    const thread = fakeThread();
    const { made, RO, MO } = fakeObservers();
    let t = 0;
    const pin = createBottomPin(thread, { ResizeObserver: RO, MutationObserver: MO, now: () => t });
    pin.pin(false);
    t = 5000;
    thread.scrollTop = 400;              // the player scrolls up
    assert.equal(pin.isPinned(), false);
    thread.clientHeight = 200;
    made.ro[0].fire();
    assert.equal(thread.scrollTop, 400);
    thread.scrollTop = 800;              // back to the bottom
    assert.equal(pin.isPinned(), true);
    thread.clientHeight = 300;
    made.ro[0].fire();
    assert.equal(thread.scrollTop, 700);
});

test('the wheel mid smooth scroll counts as the player at once', () => {
    const thread = fakeThread();
    const { RO, MO } = fakeObservers();
    const pin = createBottomPin(thread, { ResizeObserver: RO, MutationObserver: MO, now: () => 0 });
    pin.pin(true);
    thread.scrollTop = 300;              // inside the smooth window: still pinned
    assert.equal(pin.isPinned(), true);
    thread.fire('wheel');
    thread.scrollTop = 250;
    assert.equal(pin.isPinned(), false);
});

test('watches the choices panel, every bubble and bubbles added later; destroy stops it all', () => {
    const thread = fakeThread();
    const bubble = { nodeType: 1 };
    thread.children = [bubble];
    const choices = { nodeType: 1 };
    const { made, RO, MO } = fakeObservers();
    const pin = createBottomPin(thread, { watch: [choices, null], ResizeObserver: RO, MutationObserver: MO });
    const ro = made.ro[0];
    assert.deepEqual(ro.watched, [thread, choices, bubble]);
    const later = { nodeType: 1 };
    made.mo[0].cb([{ addedNodes: [later, { nodeType: 3 }] }]);
    assert.equal(ro.watched.at(-1), later);
    assert.equal(made.mo[0].target, thread);
    pin.destroy();
    assert.equal(ro.off, true);
    assert.equal(made.mo[0].off, true);
    assert.equal(thread.listeners.scroll, undefined);
});

test('works without ResizeObserver (old browser, node): pin still scrolls', () => {
    const thread = fakeThread();
    const pin = createBottomPin(thread, { ResizeObserver: null, MutationObserver: null });
    pin.pin(false);
    assert.equal(thread.scrollTop, 700);
    pin.destroy();
});
