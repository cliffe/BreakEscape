// UX access R2 (finding 12): at most two toasts on screen. A further info or success toast
// waits and shows as one goes; warnings and errors show at once; a waiting toast raised
// again is not queued twice; a waiting toast that comes up while a panel is open joins the
// held queue instead of showing over the panel.
// Run with: node test/js/toast-queue.test.mjs
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
    .split("'../utils/overlay-open.js'").join(`'${dataUrl('export const fullScreenPanelOpen = () => globalThis.__panelOpen === true;')}'`)));

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
        querySelector(sel) {
            return parts[sel] || (parts[sel] = { style: {}, nodes: [], addEventListener(_e, fn) { this.click = fn; },
                appendChild(n) { this.nodes.push(n); } });
        }
    };
}
globalThis.document = { getElementById: (id) => (id === 'notification-container' ? container : null), createElement: el,
    createTextNode: (text) => ({ text }) };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const messages = () => children.map((c) => c._toast.message);

test('the limit is two', () => { assert.equal(T.MAX_SHOWN_TOASTS, 2); });

test('a third info or success toast waits, then shows as the first goes, in order', async () => {
    T.showNotification('one', 'info', '', 200);
    T.showNotification('two', 'success', '', 600);
    const third = T.showNotification('three', 'info', '', 200);
    const fourth = T.showNotification('four', 'success', '', 200);
    assert.equal(third, null);
    assert.equal(fourth, null);
    assert.deepEqual(messages(), ['one', 'two']);
    assert.equal(T.waitingToastCount(), 2);
    await wait(600);   // 'one' gone (200 ms + 300 ms fade): 'three' takes its place
    assert.deepEqual(messages(), ['two', 'three']);
    assert.equal(T.waitingToastCount(), 1);
    await wait(1500);
    assert.equal(children.length, 0);
    assert.equal(T.waitingToastCount(), 0);
});

test('warnings and errors show at once, past the limit', async () => {
    T.showNotification('a', 'info', '', 200);
    T.showNotification('b', 'info', '', 200);
    T.showNotification('careful', 'warning', '', 200);
    T.showNotification('no', 'error', '', 0);
    assert.deepEqual(messages(), ['a', 'b', 'careful', 'no']);
    T.removeNotification(children[3]);
    await wait(700);
    assert.equal(children.length, 0);
});

test('the same waiting toast raised again waits once', async () => {
    T.showNotification('a', 'info', '', 200);
    T.showNotification('b', 'info', '', 200);
    T.showNotification('Task complete', 'success', 'Task', 200);
    T.showNotification('Task complete', 'success', 'Task', 200);
    assert.equal(T.waitingToastCount(), 1);
    await wait(1200);
    assert.equal(children.length, 0);
});

test('a waiting toast that comes up while a panel is open is held for the panel, not shown over it', async () => {
    T.showNotification('a', 'info', '', 200);
    T.showNotification('b', 'info', '', 200);
    T.showNotification('later', 'info', '', 200);
    globalThis.__panelOpen = true;
    await wait(700);
    assert.equal(children.length, 0, 'nothing shows over the panel');
    assert.equal(T.waitingToastCount(), 0, 'moved to the held queue');
    globalThis.__panelOpen = false;
    await wait(500);   // the hold polls every 300 ms
    assert.deepEqual(messages(), ['later']);
    await wait(700);
    assert.equal(children.length, 0);
});
