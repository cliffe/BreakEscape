// Engine F24 (m10 blind playtest F13): "Password Accepted", "Task Complete" and
// "Asante's Corrected Model has been noted" each showed twice. The unlock toast was
// raised, the container opened 500 ms later and pulled the toast back, and it was shown
// again when the container closed (a glimpse, then a replay). A toast raised just before
// a panel the code already knows is coming now waits for it and shows once.
// Run with: node --test test/js/toast-once-before-container.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const read = (rel) => readFileSync(join(js, rel), 'utf8');

globalThis.window = {};
const overlaySrc = read('utils/overlay-open.js');
const notifSrc = read('systems/notifications.js')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
    .split("'../utils/overlay-open.js'").join(`'${dataUrl(overlaySrc)}'`);
const T = await import(dataUrl(notifSrc));

const appended = [];
const el = () => ({
    classList: { add() {}, remove() {} }, style: {}, set innerHTML(v) { this.html = v; },
    querySelector: () => ({ style: {}, addEventListener() {} })
});
globalThis.document = {
    getElementById: (id) => (id === 'notification-container' ? { appendChild: (n) => appended.push(n) } : null),
    createElement: el
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('an unlock toast before an auto-opening container shows once, after it closes', async () => {
    appended.length = 0;
    window.MinigameFramework = { currentMinigame: null };
    const lockable = { scenarioData: { type: 'pc10', contents: [{ id: 'asante_model' }] } };
    assert.equal(T.expectContainerAfterUnlock(lockable, 'pc10'), true);

    // The toast is raised while the password minigame is already closing
    assert.equal(T.showNotification('Correct password!', 'success', 'Password Accepted', 0), null);
    assert.equal(appended.length, 0, 'not shown, so nothing to pull back');

    // 500 ms later the container opens; the manager clears the expectation
    window.MinigameFramework.currentMinigame = {};
    T.clearExpectedPanel();
    await wait(400);
    assert.equal(appended.length, 0, 'held while the container is open');

    window.MinigameFramework.currentMinigame = null;
    await wait(400);
    assert.equal(appended.length, 1, 'shown once, when the container closes');
    assert.match(appended[0].html, /Password Accepted/);
});

test('the same toast raised twice while waiting still shows once', async () => {
    appended.length = 0;
    window.MinigameFramework = { currentMinigame: null };
    T.expectPanelWithin(60);
    T.showNotification('x has been noted', 'success', 'Added to Notes', 0);
    T.showNotification('x has been noted', 'success', 'Added to Notes', 0);
    await wait(500);
    assert.equal(appended.length, 1);
});

test('the toast is not lost when the expected panel never opens', async () => {
    appended.length = 0;
    window.MinigameFramework = { currentMinigame: null };
    T.expectPanelWithin(80);
    T.showNotification('Door opened', 'success', 'Unlock Successful', 0);
    assert.equal(appended.length, 0);
    await wait(600);
    assert.equal(appended.length, 1, 'released once the window passes');
});

test('warnings and errors are never delayed by an expected panel', () => {
    appended.length = 0;
    window.MinigameFramework = { currentMinigame: null };
    T.expectPanelWithin(5000);
    T.showNotification('Wrong code', 'error', 'Rejected', 0);
    assert.equal(appended.length, 1);
    T.clearExpectedPanel();
});

test('doors, empty locks and missing lockables expect no panel', () => {
    assert.equal(T.expectContainerAfterUnlock({ doorProperties: { roomId: 'a' } }, 'door'), false);
    assert.equal(T.expectContainerAfterUnlock({ scenarioData: { contents: [{ id: 'x' }] } }, 'door'), false);
    assert.equal(T.expectContainerAfterUnlock({ scenarioData: { locked: true } }, 'safe'), false);
    assert.equal(T.expectContainerAfterUnlock(null, 'pc'), false);
    assert.equal(T.panelExpected(), false);
    assert.equal(T.expectContainerAfterUnlock({ contents: [{ id: 'x' }] }, 'safe'), true);
    T.clearExpectedPanel();
});

// Wiring: the success toast of every unlock minigame that can open a container, the
// "has been noted" toast and the manager's start all use it.
test('callers set the expectation before the toast', () => {
    const starters = read('systems/minigame-starters.js');
    for (const toast of ["'Lockpicking', 4000", "'Unlock Successful', 4000);\n                // Small delay", "'PIN Accepted', 4000);\n                callback(true, result)", "'Password Accepted', 4000);\n                callback(true, result)"]) {
        const at = starters.indexOf(toast);
        assert.ok(at > 0, toast);
        assert.match(starters.slice(Math.max(0, at - 260), at), /expectContainerAfterUnlock/, toast);
    }
    const container = read('minigames/container/container-minigame.js');
    const noted = container.indexOf('window.gameAlert(`${containerState');
    assert.match(container.slice(noted - 300, noted), /expectPanelWithin/);
    assert.match(read('minigames/framework/minigame-manager.js'), /clearExpectedPanel/);
});

// A room-entry task toast followed by a scripted conversation: the queue pulls the toast
// back before it is visible and holds later ones until the conversation opens.
test('scripted conversations expect their panel before opening', () => {
    const src = read('systems/npc-manager.js');
    const at = src.indexOf('_queueScriptedConversation(conv) {');
    assert.ok(at > 0);
    const head = src.slice(at, at + 1200);
    assert.match(head, /holdRecentNotifications/);
    assert.match(head, /expectPanelWithin\?\.\(\(conv\.startDelayMs \|\| 0\) \+ 1000\)/);
});

// The Mission Brief popup opens on a poll; toasts raised while it is due wait for it
test('the mission brief popup expects its panel while it waits', () => {
    const src = read('utils/helpers.js');
    const at = src.indexOf('export function showBriefWhenClear');
    const body = src.slice(at, src.indexOf('\n}\n', at));
    assert.match(body, /expectPanelWithin\?\./);
    assert.match(body, /holdRecentNotifications\?\./);
});
