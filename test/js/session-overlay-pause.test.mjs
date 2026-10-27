// Timed dialogue held while the session-resume overlay is up (engine fixes round 6, item 6
// follow-up). A game reloaded mid-cutscene boots under Resume / Restart / New Session, and
// person-chat's auto-advance used to keep going underneath, so lines went by unseen.
// Run with: node --test test/js/session-overlay-pause.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (rel) => readFileSync(join(js, rel), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const pause = await import(dataUrl(read('utils/session-overlay-pause.js')));

// A stand-in window: the page's flag and its close event
function fakeWindow(showing) {
    const win = new EventTarget();
    win.breakEscapeSessionOverlayShowing = showing;
    win.closeOverlay = () => {
        win.breakEscapeSessionOverlayShowing = false;
        win.dispatchEvent(new Event(pause.SESSION_OVERLAY_CLOSED));
    };
    return win;
}

// person-chat's scheduleDialogueAdvance, run as written, with the helpers bound to `win`
function scheduleFrom(win) {
    const src = read('minigames/person-chat/person-chat-minigame.js');
    const m = src.match(/\n    scheduleDialogueAdvance\(callback, delay = DIALOGUE_AUTO_ADVANCE_DELAY\) \{\n([\s\S]*?)\n    \}\n/);
    assert.ok(m, 'scheduleDialogueAdvance found');
    const make = new Function('isSessionOverlayShowing', 'onSessionOverlayClosed', 'DIALOGUE_AUTO_ADVANCE_DELAY',
        `return function scheduleDialogueAdvance(callback, delay = DIALOGUE_AUTO_ADVANCE_DELAY) {\n${m[1]}\n};`);
    return make(() => pause.isSessionOverlayShowing(win), (fn) => pause.onSessionOverlayClosed(fn, win), 5000);
}

function chat(win) {
    return { isClickThroughMode: false, autoAdvanceTimer: null, pendingContinueCallback: null,
             scheduleDialogueAdvance: scheduleFrom(win) };
}

test('the helper reads the page flag and waits for the close event', async () => {
    assert.equal(pause.isSessionOverlayShowing(fakeWindow(false)), false);
    assert.equal(pause.isSessionOverlayShowing(undefined), false, 'no window (tests, workers)');
    const win = fakeWindow(true);
    assert.equal(pause.isSessionOverlayShowing(win), true);
    let ran = 0;
    pause.onSessionOverlayClosed(() => ran++, win);
    const cancel = pause.onSessionOverlayClosed(() => ran += 10, win);
    cancel();
    let resolved = false;
    pause.whenSessionOverlayClosed(win).then(() => { resolved = true; });
    await wait(5);
    assert.equal(ran, 0);
    assert.equal(resolved, false);
    win.closeOverlay();
    await wait(0);
    assert.equal(ran, 1, 'once, and the cancelled one not at all');
    assert.equal(resolved, true);
    win.dispatchEvent(new Event(pause.SESSION_OVERLAY_CLOSED));
    assert.equal(ran, 1, 'listener removed after it ran');
    let now = 0;
    pause.onSessionOverlayClosed(() => now++, fakeWindow(false));
    assert.equal(now, 1, 'runs at once when no overlay is up');
});

test('person-chat: no advance while the overlay is up; the full delay starts at Resume', async () => {
    const win = fakeWindow(true);
    const pc = chat(win);
    let advanced = 0;
    pc.scheduleDialogueAdvance(() => advanced++, 30);
    await wait(80);
    assert.equal(advanced, 0, 'held under the overlay, well past the delay');
    assert.equal(pc.autoAdvanceTimer, null, 'no timer running');
    win.closeOverlay();
    await wait(15);
    assert.equal(advanced, 0, 'the line gets its whole delay after Resume');
    await wait(40);
    assert.equal(advanced, 1);
});

test('person-chat: a timer that comes due under the overlay waits for Resume too', async () => {
    const win = fakeWindow(false);
    const pc = chat(win);
    let advanced = 0;
    pc.scheduleDialogueAdvance(() => advanced++, 20);
    win.breakEscapeSessionOverlayShowing = true;
    await wait(60);
    assert.equal(advanced, 0);
    win.closeOverlay();
    await wait(50);
    assert.equal(advanced, 1);
});

test('person-chat: a line moved on while held is not advanced again at Resume', async () => {
    const win = fakeWindow(true);
    const pc = chat(win);
    let first = 0, second = 0;
    pc.scheduleDialogueAdvance(() => first++, 10);
    pc.scheduleDialogueAdvance(() => second++, 10);
    win.closeOverlay();
    await wait(40);
    assert.equal(first, 0, 'the replaced hold was released');
    assert.equal(second, 1);

    const win2 = fakeWindow(true);
    const pc2 = chat(win2);
    let n = 0;
    pc2.scheduleDialogueAdvance(() => n++, 10);
    pc2.pendingContinueCallback = null; // a jump or the choices took over
    win2.closeOverlay();
    await wait(30);
    assert.equal(n, 0);
});

test('person-chat: no overlay, no change; click-through mode still waits for the button', async () => {
    const win = fakeWindow(false);
    const pc = chat(win);
    let advanced = 0;
    pc.scheduleDialogueAdvance(() => advanced++, 10);
    await wait(30);
    assert.equal(advanced, 1);
    pc.isClickThroughMode = true;
    pc.scheduleDialogueAdvance(() => advanced++, 10);
    await wait(30);
    assert.equal(advanced, 1);
    assert.equal(typeof pc.pendingContinueCallback, 'function');
});

test('wiring: the voice, the closing line and phone typing wait; the page sets and clears the flag', () => {
    const pc = read('minigames/person-chat/person-chat-minigame.js');
    assert.match(pc, /await whenSessionOverlayClosed\(\);\n\s+if \(!this\.ttsManager\) return;\n\s+const audioDuration = await this\.ttsManager\.play/);
    assert.match(pc, /whenSessionOverlayClosed\(\)\.then\(\(\) => setTimeout\(\(\) => \{\n\s+if \(this\.gameState\.isActive\) this\.complete\(true\);/);
    assert.match(pc, /cleanup\(\) \{\n\s+\/\/ Drop an auto-advance held[^\n]*\n\s+this\._releaseOverlayHold\?\.\(\);/);
    const phone = read('minigames/phone-chat/phone-chat-minigame.js');
    assert.match(phone, /await whenSessionOverlayClosed\(\);\n\s+if \(!stillOurs\(\)\) return false;\n\s+const line = classifyPhoneLine/);
    const page = readFileSync(join(here, '../../app/views/break_escape/games/show.html.erb'), 'utf8');
    assert.match(page, /overlay\.style\.display = 'flex';[\s\S]{0,300}window\.breakEscapeSessionOverlayShowing = true;/);
    assert.match(page, /'session-resume-btn'\)\.addEventListener\('click', function\(\) \{\n\s+overlay\.style\.display = 'none';\n\s+window\.breakEscapeSessionOverlayShowing = false;\n\s+window\.dispatchEvent\(new Event\('break-escape:session-overlay-closed'\)\);/);
    assert.equal(pause.SESSION_OVERLAY_CLOSED, 'break-escape:session-overlay-closed');
});
