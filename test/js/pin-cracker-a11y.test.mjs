// PIN cracker guess results must be readable without the coloured lights:
// each row carries an aria-label, a polite live region announces the latest
// result, and the test bridge exposes the same text.
// Run with: node test/js/pin-cracker-a11y.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/pin/pin-minigame.js');
const root = mkdtempSync(join(tmpdir(), 'pin-a11y-'));
const dir = join(root, 'minigames');
mkdirSync(join(dir, 'pin'), { recursive: true });
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'utils', 'lock-scope-refusal.js'), readFileSync(join(here, '../../public/break_escape/js/utils/lock-scope-refusal.js'), 'utf8'));
mkdirSync(join(dir, 'framework'));
writeFileSync(join(dir, 'framework', 'base-minigame.js'), `
export class MinigameScene {
    constructor(container, params) { this.container = container; this.params = params; }
    getTestState() { return {}; }
}
`);
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'pin', 'pin-minigame.mjs'), readFileSync(src, 'utf8'));

const dom = new JSDOM('<!doctype html><body></body>');
globalThis.window = { breakEscapeConfig: { gameId: 1 } };
globalThis.document = dom.window.document;
const { PinMinigame, describeAttemptFeedback } = await import(pathToFileURL(join(dir, 'pin', 'pin-minigame.mjs')).href);

function makePin(attempts) {
    const pin = new PinMinigame({}, { correctPin: null, pinLength: 4, hasPinCracker: true, type: 'door', lockable: {} });
    pin.attemptsLogElement = document.createElement('div');
    pin.attemptsLiveElement = document.createElement('div');
    pin.infoLeakToggleElement = { checked: true };
    pin.attempts = attempts;
    return pin;
}

test('summaries: all correct, none, mixed, singular and no lights', () => {
    assert.equal(describeAttemptFeedback('0417', { rightPlace: 4, rightNumber: 0 }, true), '0 4 1 7: correct');
    assert.equal(describeAttemptFeedback('1234', { rightPlace: 0, rightNumber: 0 }, false), '1 2 3 4: no right digits');
    assert.equal(describeAttemptFeedback('1234', { rightPlace: 1, rightNumber: 2 }, false),
        '1 2 3 4: 1 right digit in the right place, 2 right digits in the wrong place');
    assert.equal(describeAttemptFeedback('1234', { rightPlace: 0, rightNumber: 1 }, false), '1 2 3 4: 1 right digit in the wrong place');
    assert.equal(describeAttemptFeedback('1234', null, false), '1 2 3 4: incorrect');
});

test('rows carry aria-label, lights are hidden, live region announces the latest guess', () => {
    const pin = makePin([
        { input: '1234', isCorrect: false, feedback: { rightPlace: 0, rightNumber: 0 } },
        { input: '4170', isCorrect: false, feedback: { rightPlace: 1, rightNumber: 3 } }
    ]);
    pin.updateAttemptsDisplay();
    const rows = pin.attemptsLogElement.querySelectorAll('.pin-minigame-attempt');
    assert.equal(rows.length, 2);
    assert.equal(rows[0].getAttribute('role'), 'group');
    assert.equal(rows[0].getAttribute('aria-label'), 'Guess 1, 1 2 3 4: no right digits');
    assert.equal(rows[1].getAttribute('aria-label'),
        'Guess 2, 4 1 7 0: 1 right digit in the right place, 3 right digits in the wrong place');
    assert.equal(rows[1].querySelector('.pin-minigame-feedback-lights').getAttribute('aria-hidden'), 'true');
    assert.equal(pin.attemptsLiveElement.textContent, rows[1].getAttribute('aria-label'));
    const st = pin.getTestState();
    assert.equal(st.lastResultSummary, pin.attemptsLiveElement.textContent);
    assert.deepEqual(st.attemptSummaries, ['1 2 3 4: no right digits', '4 1 7 0: 1 right digit in the right place, 3 right digits in the wrong place']);
});

test('a correct guess reads as correct; lights toggled off give no leak', () => {
    const pin = makePin([{ input: '0417', isCorrect: true, feedback: { rightPlace: 4, rightNumber: 0 } }]);
    pin.updateAttemptsDisplay();
    assert.equal(pin.attemptsLiveElement.textContent, 'Guess 1, 0 4 1 7: correct');
    const off = makePin([{ input: '1234', isCorrect: false, feedback: { rightPlace: 1, rightNumber: 1 } }]);
    off.infoLeakToggleElement = { checked: false };
    off.updateAttemptsDisplay();
    assert.equal(off.attemptsLiveElement.textContent, 'Guess 1, 1 2 3 4: incorrect');
});

test('clearing the log clears the live region', () => {
    const pin = makePin([]);
    pin.attemptsLiveElement.textContent = 'old';
    pin.updateAttemptsDisplay();
    assert.equal(pin.attemptsLiveElement.textContent, '');
});
