// Sweep A classification (toast over controls): a toast fading out for 300 ms stays in the
// container and must not take clicks meant for a control under it, the close X included.
// Run with: node test/js/toast-closing-pointer.test.mjs
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
        querySelector(sel) { return parts[sel] || (parts[sel] = { style: {}, addEventListener(_e, fn) { this.click = fn; }, appendChild() {} }); }
    };
}
globalThis.document = { getElementById: (id) => (id === 'notification-container' ? container : null), createElement: el, createTextNode: (text) => ({ text }) };

test('a toast taking its 300 ms fade ignores clicks, close X included', () => {
    children.length = 0;
    const t = T.gameAlert('Access denied', 'error', 'Door', 5000);
    const x = t.querySelector('.notification-close');
    assert.notEqual(t.style.pointerEvents, 'none', 'setup: a live toast is not switched off inline');
    assert.notEqual(x.style.pointerEvents, 'none');
    T.removeNotification(t);
    assert.equal(t._toast.closing, true);
    assert.equal(t.style.pointerEvents, 'none');
    assert.equal(x.style.pointerEvents, 'none', 'the X is pointer-events: auto in CSS, so it is set on its own');
});

test('closing by the X switches it off the same way', () => {
    children.length = 0;
    const t = T.gameAlert('Hello', 'info', '', 5000);
    const x = t.querySelector('.notification-close');
    x.click();
    assert.equal(t.style.pointerEvents, 'none');
    assert.equal(x.style.pointerEvents, 'none');
});
