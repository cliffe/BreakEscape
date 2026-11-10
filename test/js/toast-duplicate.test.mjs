// An identical toast raised again while it is still on screen restarts its countdown
// instead of stacking a copy (physical pentest follow-up, code review R1 m1: a refusal
// hint lasts 6 to 12 s, and three clicks on the same PC or door stacked three of them).
// Run with: node test/js/toast-duplicate.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const read = (rel) => readFileSync(join(js, rel), 'utf8');

globalThis.window = {};
const T = await import(dataUrl(read('systems/notifications.js')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
    .split("'../utils/overlay-open.js'").join(`'${dataUrl(read('utils/overlay-open.js'))}'`)));

// A container that keeps its children, as the real one does
const children = [];
const container = {
    appendChild(n) { n.parentNode = container; children.push(n); },
    removeChild(n) { n.parentNode = null; children.splice(children.indexOf(n), 1); },
    querySelectorAll: (sel) => (sel === '.notification' ? [...children] : [])
};
function el() {
    const parts = {};
    return {
        classList: { add() {}, remove() {} }, style: {}, parentNode: null,
        set innerHTML(v) { this.html = v; },
        querySelector(sel) { return parts[sel] || (parts[sel] = { style: {}, addEventListener(_e, fn) { this.click = fn; } }); }
    };
}
globalThis.document = { getElementById: (id) => (id === 'notification-container' ? container : null), createElement: el };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const HINT = 'The screen is locked. Wait for Chris to come back and unlock it.';

test('the same message, type and title while still on screen: one toast, and the same element comes back', async () => {
    const first = T.gameAlert(HINT, 'info', '', 400);
    const second = T.gameAlert(HINT, 'info', '', 400);
    const third = T.showNotification(HINT, 'info', '', 400);
    assert.equal(children.length, 1);
    assert.equal(second, first);
    assert.equal(third, first);
    await wait(800);
    assert.equal(children.length, 0, 'it still goes away');
});

test('a different message, type or title is its own toast', async () => {
    T.gameAlert(HINT, 'info', '', 300);
    T.gameAlert('Requires key', 'info', '', 300);
    T.gameAlert(HINT, 'warning', '', 300);   // not 'error': a timed error lasts at least 5 s
    T.gameAlert(HINT, 'info', 'Locked', 300);
    assert.equal(children.length, 4);
    await wait(700);
    assert.equal(children.length, 0);
});

test('the repeat restarts the countdown and the progress bar, with the new duration', async () => {
    const toast = T.gameAlert(HINT, 'info', '', 300);
    const bar = toast.querySelector('.notification-progress');
    await wait(200);
    assert.equal(bar.style.width, '0%', 'the bar was running down');
    const before = toast._toast.shownAt;
    T.gameAlert(HINT, 'info', '', 500);
    assert.equal(bar.style.width, '100%', 'back to full');
    assert.equal(bar.style.transition, 'width 500ms linear');
    assert.equal(toast._toast.duration, 500);
    assert.ok(toast._toast.shownAt >= before);
    await wait(300);   // 500 ms after the first call: the first timer would have removed it
    assert.equal(children.length, 1, 'still up: the first timer was replaced');
    await wait(600);
    assert.equal(children.length, 0);
});

test('a toast that is closing is not reused: the next one is new', async () => {
    const first = T.gameAlert(HINT, 'info', '', 5000);
    first.querySelector('.notification-close').click();   // closing: 300 ms fade
    const second = T.gameAlert(HINT, 'info', '', 300);
    assert.notEqual(second, first);
    await wait(700);
    assert.equal(children.length, 0, 'the closed toast\'s 5 s timer is gone with it');
});

test('a toast that stays until closed and a timed one are not duplicates of each other', async () => {
    const stay = T.gameAlert(HINT, 'info', '', 0);
    const timed = T.gameAlert(HINT, 'info', '', 200);
    assert.notEqual(timed, stay);
    assert.equal(T.gameAlert(HINT, 'info', '', 0), stay, 'two that stay are one');
    await wait(600);
    assert.deepEqual(children, [stay]);
    T.removeNotification(stay);
    await wait(400);
    assert.equal(children.length, 0);
});

test('findShownDuplicate: no container, or one with no query, finds nothing (first render before the DOM is ready)', () => {
    assert.equal(T.findShownDuplicate(null, 'a', 'info', ''), null);
    assert.equal(T.findShownDuplicate({ appendChild() {} }, 'a', 'info', ''), null);
});

// Code review R2, E-m5: a toast that holdRecentNotifications has pulled back behind a
// panel is on its way out, so the next identical call must make a new one.
test('a toast pulled back behind a panel is not reused', async () => {
    const first = T.gameAlert(HINT, 'info', '', 300);
    first._toast.pulled = true;
    const second = T.gameAlert(HINT, 'info', '', 300);
    assert.notEqual(second, first, 'a new element, not the pulled one');
    assert.equal(children.length, 2);
    assert.equal(T.findShownDuplicate(container, HINT, 'info', ''), second);
    await wait(700);
    assert.equal(children.length, 0);
});
