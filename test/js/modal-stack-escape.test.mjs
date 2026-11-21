// Esc closes the topmost overlay dialog (gameDisplay / gameConfirm) and only that one.
// Run with: node --test test/js/modal-stack-escape.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

// Minimal document: one capture listener list, dispatch runs them in order.
const listeners = [];
globalThis.document = {
    addEventListener: (type, fn, capture) => { if (type === 'keydown') listeners.push({ fn, capture }); },
    removeEventListener: (type, fn) => {
        const i = listeners.findIndex((l) => l.fn === fn);
        if (i !== -1) listeners.splice(i, 1);
    },
};
function press(key, extra = {}) {
    const ev = { key, repeat: false, stopped: false, prevented: false, ...extra,
        preventDefault() { this.prevented = true; },
        stopPropagation() { this.stopped = true; },
        stopImmediatePropagation() { this.stopped = true; } };
    for (const l of [...listeners]) l.fn(ev);
    return ev;
}

const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const { registerModal, openModalCount } = await import(dataUrl(readFileSync(join(js, 'ui/modal-stack.js'), 'utf8')));

test('Esc with no overlay is ignored (not swallowed)', () => {
    assert.equal(listeners.length, 0);
    const ev = press('Escape');
    assert.equal(ev.stopped, false);
});

test('Esc closes only the topmost overlay, then the next on a second press', () => {
    const closed = [];
    let unA, unB;
    unA = registerModal(() => { closed.push('A'); unA(); });
    unB = registerModal(() => { closed.push('B'); unB(); });
    assert.equal(openModalCount(), 2);
    const ev = press('Escape');
    assert.deepEqual(closed, ['B']);
    assert.equal(ev.stopped, true, 'event must not reach the minigame underneath');
    assert.equal(openModalCount(), 1);
    press('Escape');
    assert.deepEqual(closed, ['B', 'A']);
    assert.equal(openModalCount(), 0);
    assert.equal(listeners.length, 0, 'listener removed when idle');
});

test('key repeat swallows Esc without closing a second layer', () => {
    const closed = [];
    const un = registerModal(() => { closed.push('A'); un(); });
    const ev = press('Escape', { repeat: true });
    assert.deepEqual(closed, []);
    assert.equal(ev.stopped, true);
    press('Escape');
    assert.deepEqual(closed, ['A']);
});

test('other keys pass through, and unregister on click-close leaves no listener', () => {
    const un = registerModal(() => {});
    const ev = press('a');
    assert.equal(ev.stopped, false);
    un();
    assert.equal(listeners.length, 0);
});

test('gameDisplay and gameConfirm register with the stack; only gameDisplay has a close X', () => {
    const src = readFileSync(join(js, 'systems/notifications.js'), 'utf8');
    assert.equal((src.match(/registerModal\(/g) || []).length, 2);
    // gameDisplay draws the X and wires it; a confirm has none (UX q99) unless the caller asks
    // for options.closeX (one named button plus the X, sis02 m8): 2 uses in gameDisplay, 2 in that branch
    assert.equal((src.match(/game-modal-close/g) || []).length, 4);
    assert.match(src, /const closeX = plainText && !!\(options && options\.closeX === true\)/, 'a confirm has an X only on closeX');
    assert.match(src, /registerModal\(\(\) => finish\(false\)\)/, 'gameConfirm Esc must cancel (resolve false)');
});

test('yieldsToNext: a later registration closes the flagged entry; an unflagged one stays', () => {
    const closed = [];
    let unMenu, unPlain, unNext;
    unPlain = registerModal(() => { closed.push('plain'); });
    unMenu = registerModal(() => { closed.push('menu'); unMenu(); }, { yieldsToNext: true });
    assert.equal(openModalCount(), 2);
    unNext = registerModal(() => { closed.push('next'); unNext(); });
    assert.deepEqual(closed, ['menu'], 'only the flagged entry closed');
    assert.equal(openModalCount(), 2, 'plain and next remain');
    press('Escape');
    assert.deepEqual(closed, ['menu', 'next'], 'Esc closes the newest');
    unPlain();
    assert.equal(openModalCount(), 0);
});

test('yieldsToNext: each flagged entry closes in turn, and a close that throws does not block the new overlay', () => {
    const closed = [];
    registerModal(() => { closed.push('a'); throw new Error('broken close'); }, { yieldsToNext: true });
    registerModal(() => { closed.push('b'); }, { yieldsToNext: true });
    assert.deepEqual(closed, ['a'], 'b registering closed a');
    assert.equal(openModalCount(), 1, 'a was removed although its close threw, and its close did not unregister');
    let un;
    un = registerModal(() => { closed.push('c'); un(); });
    assert.deepEqual(closed, ['a', 'b']);
    assert.equal(openModalCount(), 1, 'only c is left');
    press('Escape');
    assert.deepEqual(closed, ['a', 'b', 'c']);
    assert.equal(openModalCount(), 0);
});
