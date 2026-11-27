// test_access_networks game 1750: the task toasts for P2, P3, N2 and N3 each showed twice.
// They were held while the network screens were open. Closing a share reopens its desktop,
// and closing a desktop reopens the network view, one tick later (setTimeout 0). When the
// close was slow, the 300 ms release poll was already due and ran first, in the gap: the
// toasts were shown, the reopened panel pulled them back as a glimpse, and they were shown
// again when the last panel closed. The framework now asks held toasts to wait a moment
// after a minigame ends (notifications.js PANEL_SETTLE_MS), so they show once.
//
// Drives the real MinigameFramework and the real notifications.js.
// Run with: node --test test/js/toast-once-across-panel-handover.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const read = (rel) => readFileSync(join(js, rel), 'utf8');

// The notification container: what is on screen now, and every toast ever drawn
const drawn = [];
const box = {
    children: [],
    appendChild(n) { n.parentNode = box; box.children.push(n); drawn.push(n); },
    removeChild(n) { box.children = box.children.filter((c) => c !== n); n.parentNode = null; },
    querySelectorAll: () => [...box.children]
};
const el = () => ({
    classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {},
    set innerHTML(v) { this.html = v; },
    querySelector: () => ({ style: {}, addEventListener() {}, appendChild() {} }),
    hasAttribute: () => false, remove() {}
});
globalThis.window = {};
globalThis.document = {
    getElementById: (id) => (id === 'notification-container' ? box : null),
    createElement: el, createTextNode: (text) => ({ text }),
    querySelector: () => null, querySelectorAll: () => [],
    body: { appendChild() {}, classList: { toggle() {} } }
};

const overlaySrc = read('utils/overlay-open.js');
const notifSrc = read('systems/notifications.js')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
    .split("'../utils/overlay-open.js'").join(`'${dataUrl(overlaySrc)}'`);
const T = await import(dataUrl(notifSrc));
const mgrSrc = read('minigames/framework/minigame-manager.js')
    .split("'./base-minigame.js'").join(`'${dataUrl('export class MinigameScene {}')}'`);
const { MinigameFramework: MF } = await import(dataUrl(mgrSrc));
window.MinigameFramework = MF;
window.resumeKeyboardInput = () => {};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const busy = (ms) => { const end = Date.now() + ms; while (Date.now() < end) { /* a slow close */ } };
const count = (title) => drawn.filter((n) => n._toast?.message === title).length;

// A screen whose Close reopens its parent one tick later, as a share or a desktop does
// (container-minigame.js reportNetworkExit). slowMs stands in for a close on a busy machine.
let slowMs = 0;
class Child {
    constructor(container, params) { this.container = container; this.params = params; }
    init() {}
    start() {}
    cleanup() {
        busy(slowMs);
        setTimeout(() => { if (!MF.currentMinigame) MF.startMinigame('parent', null, {}); }, 0);
    }
}
class Parent {
    constructor(container, params) { this.container = container; this.params = params; }
    init() {}
    start() {}
    cleanup() {}
}
MF.registerScene?.('child', Child);
MF.registerScene?.('parent', Parent);
MF.registeredScenes.child = Child;
MF.registeredScenes.parent = Parent;

function reset() {
    drawn.length = 0;
    box.children = [];
    MF.currentMinigame = null;
    T.clearExpectedPanel();
}

test('task toasts held over a share, its desktop and the view show once each', async () => {
    reset();
    slowMs = 450;   // longer than a poll interval, and longer than the settle window itself
    MF.startMinigame('child', null, {});
    // Two different tasks complete together while the screen is open: both are held
    T.showNotification('✓ P2: plant the box', 'success', 'Task Complete');
    T.showNotification('✓ P3: look at what the box reaches', 'success', 'Task Complete');
    await wait(50);
    assert.equal(drawn.length, 0, 'held while the screen is open');

    MF.endMinigame(true, null);     // Close: the parent reopens a tick later
    await wait(150);
    assert.equal(MF.currentMinigame?.constructor, Parent, 'the parent reopened');
    assert.equal(drawn.length, 0, 'nothing shown in the gap between the two panels');

    MF.endMinigame(true, null);     // Close the parent: nothing reopens
    await wait(1200);
    assert.equal(count('✓ P2: plant the box'), 1, 'P2 shown once');
    assert.equal(count('✓ P3: look at what the box reaches'), 1, 'P3 shown once');
});

test('toasts held over a panel that reopens nothing are still shown', async () => {
    reset();
    slowMs = 0;
    MF.startMinigame('parent', null, {});
    T.showNotification('✓ N8: join the guest Wi-Fi', 'success', 'Task Complete');
    MF.endMinigame(true, null);
    await wait(1000);
    assert.equal(count('✓ N8: join the guest Wi-Fi'), 1);
});

test('the same toast raised again later, after the first has gone, shows again', async () => {
    reset();
    T.showNotification('Dropped Spare USB stick', 'info', '', 50);
    await wait(500);   // timed out and removed
    T.showNotification('Dropped Spare USB stick', 'info', '', 50);
    assert.equal(count('Dropped Spare USB stick'), 2);
});

test('a panel starting clears the settle window, so its own toasts hold as before', async () => {
    reset();
    T.settleAfterPanelClose();
    assert.equal(T.panelExpected(), true);
    MF.startMinigame('parent', null, {});
    assert.equal(T.panelExpected(), false);
    MF.currentMinigame = null;
});

test('warnings are not delayed by the settle window', () => {
    reset();
    T.settleAfterPanelClose();
    T.showNotification('Wrong key', 'warning', 'Rejected', 0);
    assert.equal(drawn.length, 1);
    T.clearExpectedPanel();
});

// Code review R2 m1: the settle window and the two-toast limit together. Five task toasts
// held over a share-to-parent handover come out through the limit: each drawn once, in
// order, and never more than three on screen.
test('five toasts held over a handover come out through the limit, once each and in order', async () => {
    reset();
    slowMs = 450;
    let most = 0;
    const sample = setInterval(() => {
        most = Math.max(most, box.children.filter((c) => !c._toast?.closing).length);
    }, 20);
    MF.startMinigame('child', null, {});
    const names = [1, 2, 3, 4, 5].map((n) => 'task ' + n);
    names.forEach((m) => T.showNotification(m, 'success', 'Task Complete', 1500));
    MF.endMinigame(true, null);   // Close: the parent reopens a tick later
    await wait(150);
    assert.equal(drawn.length, 0, 'nothing shown in the gap');
    MF.endMinigame(true, null);   // Close the parent
    await wait(1200);
    assert.equal(drawn.length, 2, 'two shown once the screen settles');
    assert.equal(T.waitingToastCount(), 3, 'the rest wait their turn');
    while (T.waitingToastCount() > 0) await wait(100);
    clearInterval(sample);
    names.forEach((m) => assert.equal(count(m), 1, m + ' drawn once'));
    assert.deepEqual(drawn.map((n) => n._toast.message), names);
    assert.ok(most <= T.MAX_SHOWN_TOASTS + 1, `at most three on screen (saw ${most})`);
    await wait(2000);
});
