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

test('the combination dials take any numbers, L-R-L, and send them as typed', async () => {
    const m = new CombinationMinigame(null, { lockable, type: 'object' });
    m.gameContainer = fakeContainer();
    m._updateDialDisplay = () => {};
    m._updateDirectionIndicator = () => {};
    const unlockBtn = m.gameContainer.querySelector('#comb-unlock-btn');

    for (let i = 0; i < 3; i++) m._rotateDial(0, 'left');           // dial 1 to 37
    assert.equal(m.directionIndex, 0);
    m._rotateDial(1, 'right');                                       // sets dial 1, moves on
    assert.equal(m.directionIndex, 1);
    assert.equal(m.dials[1], 0, 'moving on does not turn the new dial');
    for (let i = 0; i < 4; i++) m._rotateDial(1, 'right');          // dial 2 to 4
    assert.equal(unlockBtn.disabled, true, 'nothing to try before the last dial');
    m._rotateDial(2, 'left');                                        // sets dial 2, last dial at 0
    assert.equal(m.directionIndex, 2);
    assert.equal(unlockBtn.disabled, false, 'the last dial can be tried at 0');
    m._rotateDial(2, 'left');                                        // dial 3 to 39

    m._rotateDial(0, 'left');
    assert.match(m.gameContainer.querySelector('#comb-status').textContent, /Dial 1 is set/);
    assert.deepEqual(m.dials, [37, 4, 39]);

    const calls = sent();
    assert.equal(await m._validateWithServer(), true);
    assert.deepEqual(calls[0], ['object', 'locker', '37-4-39', 'combination']);
});

test('a wrong direction on the current dial still resets', () => {
    const m = new CombinationMinigame(null, { lockable, type: 'object' });
    m.gameContainer = fakeContainer();
    m._updateDialDisplay = () => {};
    m._updateDirectionIndicator = () => {};
    let resets = 0;
    m._handleReset = () => { resets++; };
    m._rotateDial(0, 'right');
    assert.equal(resets, 1);
    assert.equal(m.dials[0], 0);
});

test('the cryptex keeps no answer and lets any word be submitted', async () => {
    const m = new CryptexMinigame(null, { lockable, type: 'object', cryptexConfig: { wheelCount: 3, answer: 'CAT' } });
    assert.equal(m.answerIndices, undefined, 'no answer is parsed');
    m.gameContainer = fakeContainer();
    const submitBtn = m.gameContainer.querySelector('#cryptex-submit-btn');

    m._rotateWheel(0, 1);   // B
    m._rotateWheel(2, -1);  // Z
    assert.equal(submitBtn.disabled, false, 'a wrong-looking word can be tried');

    const calls = sent();
    assert.equal(await m._validateWithServer(), true);
    assert.deepEqual(calls[0], ['object', 'locker', 'BAZ', 'cryptex']);
});
