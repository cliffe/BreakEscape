// Review 9.2 H R2 n2 (user decision q44): a verbatim toast (an overheard password) that a
// minigame opening pulls back into the hold (holdRecentNotifications) is shown again as it
// was: no dash display, spaces kept. Drives the real notifications.js through its exported
// entry points with a small fake DOM, so the held queue and its release need no seam.
// Run with: node --test test/js/toast-hold-verbatim.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

// A dash display that leaves a mark, so a message that went through it can be told apart
const overlaySrc = readFileSync(join(js, 'utils/overlay-open.js'), 'utf8');
globalThis.window = {};
const notifSrc = readFileSync(join(js, 'systems/notifications.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl("export const displayDashes = (s) => String(s).split('--').join('[dash]');")}'`)
    .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
    .split("'../utils/overlay-open.js'").join(`'${dataUrl(overlaySrc)}'`);
const { showNotification, holdRecentNotifications } = await import(dataUrl(notifSrc));

// Elements: children by selector, text nodes and <br>s appended in order
function fakeEl(tag = 'div') {
    const el = {
        tag, style: {}, children: [], parentNode: null, _parts: {},
        classList: { add() {}, remove() {} },
        set innerHTML(v) { this.html = v; },
        get innerHTML() { return this.html; },
        appendChild(n) { this.children.push(n); n.parentNode = this; return n; },
        removeChild(n) { this.children = this.children.filter(c => c !== n); n.parentNode = null; },
        addEventListener() {},
        querySelector(sel) { return this._parts[sel] || (this._parts[sel] = fakeEl()); },
        get text() { return this.children.map(c => (c.tag === 'br' ? '\n' : (c.text ?? ''))).join(''); }
    };
    return el;
}
const container = fakeEl();
container.querySelectorAll = (sel) => (sel === '.notification' ? container.children.filter(c => /\bnotification\b/.test(c.className || '')) : []);
globalThis.document = {
    getElementById: (id) => (id === 'notification-container' ? container : null),
    createElement: (tag) => fakeEl(tag),
    createTextNode: (text) => ({ text })
};
const shown = () => container.children.map(el => ({
    message: el.querySelector('.notification-message').text,
    whiteSpace: el.querySelector('.notification-message').style.whiteSpace,
    verbatim: el._toast.verbatim, seen: el._toast.seen
}));

test('a verbatim toast pulled back when a minigame opens is shown again verbatim when it closes', async () => {
    const pw = "It's sokafor. Password's  Spring--24 ";
    window.MinigameFramework = { currentMinigame: null };
    showNotification(pw, 'info', 'Overheard: Sam Okafor', 8000, { plainText: true, verbatim: true });
    showNotification('a plain -- toast', 'info', 'Other', 8000);
    assert.deepEqual(shown().map(s => s.message), [pw, 'a plain [dash] toast'], 'first shown: only the plain one has the dash display');

    window.MinigameFramework.currentMinigame = {};   // a conversation opens at once
    assert.equal(holdRecentNotifications(Date.now()), 2, 'both glimpsed toasts go back in the hold');
    assert.equal(container.children.length, 0);

    window.MinigameFramework.currentMinigame = null;
    await new Promise((r) => setTimeout(r, 450));    // the hold polls every 300 ms
    const again = shown();
    assert.equal(again.length, 2, 'released once the panel closed');
    assert.deepEqual(again[0], { message: pw, whiteSpace: 'pre-wrap', verbatim: true, seen: true }, 'the password exactly, spaces kept');
    assert.equal(again[1].message, 'a plain [dash] toast');
    assert.equal(again[1].verbatim, false);
});
