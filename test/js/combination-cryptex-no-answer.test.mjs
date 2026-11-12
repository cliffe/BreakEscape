// Unlock gaps build (2026-11-12): the combination padlock and the cryptex no longer know their
// answer. The server checks it against the lock's `requires`, which never reaches the client,
// so each screen lets the player set any value and submit it, and sends what was set.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (rel) => readFileSync(join(js, rel), 'utf8');

const root = mkdtempSync(join(tmpdir(), 'combination-cryptex-no-answer-'));
const put = (rel, text) => { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), text); };
put('package.json', '{"type":"module"}');
put('config.js', 'export const ASSETS_PATH = "";\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
put('utils/escape-html.js', read('utils/escape-html.js'));
put('utils/lock-scope-refusal.js', read('utils/lock-scope-refusal.js'));
put('minigames/framework/base-minigame.js', 'export class MinigameScene { constructor(container, params) { this.params = params; } cleanup() {} }\n');
for (const rel of ['minigames/combination/combination-minigame.js', 'minigames/cryptex/cryptex-minigame.js']) put(rel, read(rel));

globalThis.window = { breakEscapeConfig: { gameId: 1 } };
const load = (rel) => import(pathToFileURL(join(root, rel)).href);
const { CombinationMinigame } = await load('minigames/combination/combination-minigame.js');
const { CryptexMinigame } = await load('minigames/cryptex/cryptex-minigame.js');

const lockable = { scenarioData: { id: 'locker' } };

function fakeContainer() {
    const els = {};
    return {
        els,
        querySelector(sel) {
            els[sel] ||= { disabled: true, textContent: '', className: '', classList: { add() {}, remove() {} } };
            return els[sel];
        }
    };
}

function sent() {
    const calls = [];
    window.ApiClient = { unlock: async (...args) => { calls.push(args); return { success: true }; } };
    return calls;
}

test('the combination screen keeps no answer, even one passed in', () => {
    const m = new CombinationMinigame(null, { lockable, type: 'object', combination: [12, 30, 5] });
    assert.equal(m.combination, undefined);
});

function padlock() {
    const m = new CombinationMinigame(null, { lockable, type: 'object' });
    m.gameContainer = fakeContainer();
    return m;
}
const status = (m) => m.gameContainer.querySelector('#comb-status');

test('the combination dials take any numbers and send them as set', async () => {
    const m = padlock();
    const unlockBtn = m.gameContainer.querySelector('#comb-unlock-btn');

    for (let i = 0; i < 3; i++) m._rotateDial(0, 'left');           // dial 1 to 37
    assert.equal(m.activeDial, 0);
    m._rotateDial(1, 'right');                                       // sets dial 1, turns dial 2 to 1
    assert.equal(m.activeDial, 1);
    assert.equal(m.dials[1], 1, 'the first click on the next dial turns it, so it visibly does something');
    assert.match(status(m).textContent, /Dial 1 set at 37/);
    for (let i = 0; i < 3; i++) m._rotateDial(1, 'right');          // dial 2 to 4
    assert.equal(unlockBtn.disabled, true, 'nothing to try before the last dial');
    m._rotateDial(2, 'right');                                       // sets dial 2, dial 3 to 1
    assert.equal(m.activeDial, 2);
    assert.equal(unlockBtn.disabled, false, 'the last dial can be tried');
    m._rotateDial(2, 'left');
    m._rotateDial(2, 'left');                                        // dial 3 to 39

    m._rotateDial(0, 'left');
    assert.match(status(m).textContent, /Dial 1 is set at 37/);
    assert.deepEqual(m.dials, [37, 4, 39]);

    const calls = sent();
    assert.equal(await m._validateWithServer(), true);
    assert.deepEqual(calls[0], ['object', 'locker', '37-4-39', 'combination']);
});

test('R1 M1: the opposite arrow steps back one number, with no reset', () => {
    const m = padlock();
    for (let i = 0; i < 13; i++) m._rotateDial(0, 'right');         // overshoot to 13
    m._rotateDial(0, 'left');                                        // back to 12
    assert.deepEqual(m.dials, [12, 0, 0]);
    assert.equal(m.activeDial, 0);
    m._rotateDial(1, 'left');                                        // set dial 1; dial 2 to 39
    for (let i = 0; i < 9; i++) m._rotateDial(1, 'left');           // 30
    m._rotateDial(1, 'left');                                        // overshoot to 29
    m._rotateDial(1, 'right');                                       // back to 30
    assert.deepEqual(m.dials, [12, 30, 0]);
    assert.equal(m.activeDial, 1, 'a back-step never moves to another dial');
    assert.equal(m.gameContainer.querySelector('#comb-display-0').textContent, '12', 'the set number stays on show');
});

test('R1 M1: a reset says what happened after it, never before it', () => {
    const m = padlock();
    m._rotateDial(0, 'right');
    m._handleReset();
    assert.deepEqual(m.dials, [0, 0, 0]);
    assert.match(status(m).textContent, /back at 00/i, 'the reset leaves a visible message');
});

test('R1 m4: a wrong combination says how to try again, and no dial stays marked set', () => {
    const m = padlock();
    m._rotateDial(0, 'right');
    m._rotateDial(1, 'right');
    m._rotateDial(2, 'right');                                       // 01-01-01
    m.isSubmitting = true;                                           // as _handleUnlock leaves it
    m._handleFailure();
    assert.match(status(m).textContent, /01-01-01 did not open it\. 2 attempts left\. .*set dial 1 again/);
    assert.deepEqual(m.dials, [0, 0, 0]);
    assert.equal(m.activeDial, 0, 'no dial is left set (green) to hint that it was right');
    assert.equal(m.isSubmitting, false, 'the dials can be turned again at once');
    m._rotateDial(0, 'right');
    assert.equal(m.dials[0], 1);
});

test('a dial out of turn is refused with a reason', () => {
    const m = padlock();
    m._rotateDial(2, 'left');
    assert.match(status(m).textContent, /Set dial 1 first/);
    assert.deepEqual(m.dials, [0, 0, 0]);
});

test('success marks every dial set and the header open', () => {
    const m = padlock();
    m._rotateDial(1, 'right');
    m._rotateDial(2, 'right');
    m.startTime = Date.now();
    m.complete = () => {};
    m._handleSuccess();
    assert.equal(m.gameContainer.querySelector('#comb-direction').textContent, 'Open');
    assert.equal(m.gameContainer.querySelector('#comb-label-2').textContent, 'Dial 3 · SET');
});

test('the cryptex keeps no answer and lets any word be submitted', async () => {
    const m = new CryptexMinigame(null, { lockable, type: 'object', cryptexConfig: { wheelCount: 3, answer: 'CAT' } });
    assert.equal(m.answerIndices, undefined, 'no answer is parsed');
    m.gameContainer = fakeContainer();
    const submitBtn = m.gameContainer.querySelector('#cryptex-submit-btn');

    m._rotateWheel(0, 1);   // B
    m._rotateWheel(2, -1);  // Z
    m._checkCompletion();
    assert.equal(submitBtn.disabled, false, 'a wrong-looking word can be tried');

    const calls = sent();
    assert.equal(await m._validateWithServer(), true);
    assert.deepEqual(calls[0], ['object', 'locker', 'BAZ', 'cryptex']);
});

test('R1 n5 and UX: the opening word can be tried, a refused word waits for a turn, and says so', () => {
    const m = new CryptexMinigame(null, { lockable, type: 'object', cryptexConfig: { wheelCount: 3 } });
    m.gameContainer = fakeContainer();
    const submitBtn = m.gameContainer.querySelector('#cryptex-submit-btn');
    submitBtn.disabled = false;               // the button is rendered enabled
    m.complete = () => {};
    m._handleFailure();                       // AAA refused
    assert.equal(submitBtn.disabled, true, 'the same word cannot be sent twice');
    assert.match(m.gameContainer.querySelector('#cryptex-status').textContent, /AAA did not open it\. 2 attempts left\. Turn a wheel/);
    m._rotateWheel(1, 1);
    assert.equal(submitBtn.disabled, false);
    m._rotateWheel(1, -1);                    // back to AAA
    assert.equal(submitBtn.disabled, true);
});

test('the cryptex up arrow is the next letter and the down arrow the one before', () => {
    const src = read('minigames/cryptex/cryptex-minigame.js');
    assert.match(src, /upBtn, 'click', \(\) => this\._rotateWheel\(i, 1\)/);
    assert.match(src, /downBtn, 'click', \(\) => this\._rotateWheel\(i, -1\)/);
    const m = new CryptexMinigame(null, { lockable, type: 'object', cryptexConfig: { wheelCount: 1 } });
    m.gameContainer = fakeContainer();
    m._rotateWheel(0, -1);
    assert.equal(m._word(), 'Z', 'down from A wraps to Z');
});

// ── Code review R2 ────────────────────────────────────────────────────────────

// A padlock with its arrow buttons bound through _bindArrow, and fake timers
function boundPadlock(t) {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const m = padlock();
    const handlers = new Map();
    m.addEventListener = (btn, ev, fn) => { handlers.set(`${btn.id}:${ev}`, fn); };
    for (let i = 0; i < 3; i++) for (const dir of ['left', 'right']) m._bindArrow({ id: `${dir}${i}` }, i, dir);
    const fire = (id, ev) => handlers.get(`${id}:${ev}`)();
    // Small steps, so a timer set by a timer that fired is run in the same span
    const advance = (ms) => { for (let i = 0; i < ms; i += 5) t.mock.timers.tick(5); };
    return { m, fire, advance };
}

test('R2 m3: holding the next dial\'s arrow sets the current dial and spins the next', (t) => {
    const { m, fire, advance } = boundPadlock(t);
    fire('right0', 'click');
    fire('right0', 'click');                       // dial 1 at 02
    fire('right1', 'pointerdown');
    advance(380);                       // first tick: sets dial 1, dial 2 to 01
    assert.equal(m.activeDial, 1);
    assert.equal(m.dials[0], 2);
    advance(110 * 4);                   // four more turns
    assert.equal(m.dials[1], 5, 'the hold keeps spinning the new dial');
    fire('right1', 'pointerup');
    fire('right1', 'click');                       // the click that ends a hold is ignored
    assert.equal(m.dials[1], 5);
    advance(1000);
    assert.equal(m.dials[1], 5, 'released: no more turns');
});

test('R2 m3: holding a dial two ahead still does nothing', (t) => {
    const { m, fire, advance } = boundPadlock(t);
    fire('right2', 'pointerdown');
    advance(2000);
    assert.deepEqual(m.dials, [0, 0, 0]);
    assert.equal(m.activeDial, 0);
});

test('R2 n4: a hold released off the button does not swallow the next key press', (t) => {
    const { m, fire, advance } = boundPadlock(t);
    fire('right0', 'pointerdown');
    advance(380);                       // the hold fires once
    fire('right0', 'pointerleave');                // released elsewhere: no click
    assert.equal(m.dials[0], 1);
    fire('right0', 'keydown');
    fire('right0', 'click');                       // Enter on the arrow
    assert.equal(m.dials[0], 2, 'the key press turns the dial');
});

test('R2 n5: at spin speed the click sounds on every third turn only', (t) => {
    const { m, fire, advance } = boundPadlock(t);
    let sounds = 0;
    window.playUISound = () => { sounds++; };
    try {
        fire('right0', 'pointerdown');
        advance(380 + 110 * 8);         // 9 slow turns, each heard
        assert.equal(sounds, 9);
        advance(45 * 9);                // 9 fast turns, a third heard
        assert.equal(m.dials[0], 18);
        assert.equal(sounds, 12);
        fire('right0', 'pointerup');
    } finally {
        delete window.playUISound;
    }
});

function failingFetch() {
    window.ApiClient = { unlock: async () => { throw new TypeError('Failed to fetch'); } };
}

test('R2 m4: a padlock network error keeps the dials, counts no try and allows a resend', async () => {
    const m = padlock();
    m._rotateDial(0, 'right');
    m._rotateDial(1, 'right');
    m._rotateDial(1, 'right');
    m._rotateDial(2, 'right');                     // 01-02-01
    m.attemptCount = 0;
    m.complete = () => {};
    failingFetch();
    await m._handleUnlock();
    assert.deepEqual(m.dials, [1, 2, 1], 'the dials are kept');
    assert.equal(m.activeDial, 2);
    assert.equal(m.attemptCount, 0, 'no attempt is counted');
    assert.equal(m.isLocked, false);
    assert.equal(m.gameContainer.querySelector('#comb-unlock-btn').disabled, false, 'UNLOCK can send again');
    assert.match(status(m).textContent, /Network error: 01-02-01 was not checked/);
    assert.doesNotMatch(status(m).textContent, /did not open/);

    const calls = sent();
    await m._handleUnlock();
    assert.deepEqual(calls[0], ['object', 'locker', '1-2-1', 'combination'], 'the resend carries the same numbers');
});

test('R2 m4: a cryptex network error keeps the word sendable and counts no try', async () => {
    const m = new CryptexMinigame(null, { lockable, type: 'object', cryptexConfig: { wheelCount: 3 } });
    m.gameContainer = fakeContainer();
    const submitBtn = m.gameContainer.querySelector('#cryptex-submit-btn');
    m.attemptCount = 0;
    m._rotateWheel(0, 1);                          // BAA
    failingFetch();
    await m._handleSubmit();
    assert.equal(m.attemptCount, 0);
    assert.equal(m.lastTried, undefined, 'the word is not marked as tried');
    assert.equal(submitBtn.disabled, false, 'Submit can send it again');
    assert.match(m.gameContainer.querySelector('#cryptex-status').textContent, /Network error: BAA was not checked/);
    m._checkCompletion();
    assert.equal(submitBtn.disabled, false);
});
