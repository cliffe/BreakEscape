// Code review R1 m1: a note already absolute but placed by bottom (the desktop post-it,
// bottom: 64px, top: auto) stays where it is drawn on the first press instead of jumping
// to the top of the monitor, then follows the pointer.
// Run with: node test/js/draggable-bottom-anchored.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/utils/helpers.js'), 'utf8');
const start = src.indexOf('export function makeDraggable');
const body = src.slice(start, src.indexOf('\n}\n', start) + 2).replace('export function', 'function');
const listeners = {};
globalThis.document = { body: null, addEventListener(t, fn) { listeners[t] = fn; }, removeEventListener(t) { delete listeners[t]; } };
globalThis.getComputedStyle = (el) => ({ position: el.cssPosition });
const makeDraggable = new Function(`${body}; return makeDraggable;`)();

// A monitor at page (100, 50), 2px border, 600 tall; the note is drawn 64px above its
// bottom: top 600 - 64 - 120 = 416 inside the padding box.
function setup() {
    const parent = { clientLeft: 2, clientTop: 2, getBoundingClientRect: () => ({ left: 100, top: 50 }) };
    const el = {
        cssPosition: 'absolute', style: { bottom: '64px' }, offsetParent: parent, handlers: {},
        addEventListener(t, fn) { this.handlers[t] = fn; },
        getBoundingClientRect: () => ({ left: 100 + 2 + 20, top: 50 + 2 + 416 }),
        // offsetLeft/Top follow the inline left/top, as they would in a browser; with
        // top and bottom both auto they would be the static place (0, 0)
        get offsetLeft() { return this.style.left && this.style.left !== 'auto' ? parseFloat(this.style.left) : 0; },
        get offsetTop() { return this.style.top && this.style.top !== 'auto' && this.style.bottom === 'auto' ? parseFloat(this.style.top) : 0; }
    };
    return el;
}

test('the first press keeps a bottom-anchored note where it is drawn', () => {
    const el = setup();
    makeDraggable(el);
    el.handlers.mousedown({ preventDefault() {}, clientX: 300, clientY: 500 });
    assert.equal(el.style.bottom, 'auto');
    assert.equal(el.style.left, '20px');
    assert.equal(el.style.top, '416px', 'pinned at its drawn place, not the top of the monitor');
    listeners.mousemove({ preventDefault() {}, clientX: 310, clientY: 480 });
    assert.equal(el.style.left, '30px');
    assert.equal(el.style.top, '396px', 'moves with the pointer from where it was');
    listeners.mouseup();
});
