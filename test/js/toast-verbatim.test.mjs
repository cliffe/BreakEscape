// A plain text toast with `verbatim` shows its message exactly as given: no markup and no
// " -- " dash display (access slice 9.2 H, code review R1 M1: an overheard password such as
// Spring--24 or R&D<2024> must reach the player character for character).
// Run with: node test/js/toast-verbatim.test.mjs
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
    .split("'../utils/display-dashes.js'").join(`'${dataUrl(read('utils/display-dashes.js'))}'`)
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
        querySelector(sel) {
            return parts[sel] || (parts[sel] = { style: {}, nodes: [], addEventListener(_e, fn) { this.click = fn; },
                appendChild(n) { this.nodes.push(n); } });
        }
    };
}
globalThis.document = { getElementById: (id) => (id === 'notification-container' ? container : null), createElement: el,
    createTextNode: (text) => ({ text }) };

const shown = (toast) => toast.querySelector('.notification-message').nodes.map((n) => n.text ?? '\n').join('');

test('verbatim plain text keeps "--" and markup characters exactly', () => {
    const line = "It's sokafor. Password's Spring--24<b>*x*</b>.";
    const toast = T.gameAlert(line, 'info', 'Overheard: <i>Sam</i>', 100, { plainText: true, verbatim: true });
    assert.equal(shown(toast), line);
    assert.equal(toast.querySelector('.notification-title').textContent, 'Overheard: <i>Sam</i>', 'the title is plain text');
    assert.ok(!toast.html.includes('<b>'), 'nothing of the message went in as HTML');
});

test('plain text without verbatim still shows the dash display', () => {
    const toast = T.gameAlert('word--word', 'info', '', 100, { plainText: true });
    assert.equal(shown(toast), 'word – word');
});
