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
