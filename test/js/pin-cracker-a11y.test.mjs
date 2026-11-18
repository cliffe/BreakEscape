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
    pin.updateAttemptsDisplay({ announce: true });
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
    pin.updateAttemptsDisplay({ announce: true });
    assert.equal(pin.attemptsLiveElement.textContent, 'Guess 1, 0 4 1 7: correct');
    const off = makePin([{ input: '1234', isCorrect: false, feedback: { rightPlace: 1, rightNumber: 1 } }]);
    off.infoLeakToggleElement = { checked: false };
    off.updateAttemptsDisplay({ announce: true });
    assert.equal(off.attemptsLiveElement.textContent, 'Guess 1, 1 2 3 4: incorrect');
});

test('clearing the log clears the live region', () => {
    const pin = makePin([]);
    pin.attemptsLiveElement.textContent = 'old';
    pin.updateAttemptsDisplay();
    assert.equal(pin.attemptsLiveElement.textContent, '');
});

// Drive a real guess through _checkCurrentInput with the server call stubbed.
async function guess(pin, code, { correct = false, feedback = null, networkError = false } = {}) {
    pin.currentInput = code;
    pin.validatePinWithServer = async () => {
        if (networkError) pin.lastAttemptWasNetworkError = true;
        else pin.lastServerFeedback = feedback;
        return correct;
    };
    pin.handleFailure = () => {};
    pin.handleSuccess = () => {};
    window.ApiClient = {};
    await pin._checkCurrentInput();
}

function makeBare(params = {}) {
    const pin = new PinMinigame({}, { correctPin: null, pinLength: 4, type: 'door', lockable: {}, ...params });
    pin.attemptsLogElement = document.createElement('div');
    pin.attemptsLiveElement = document.createElement('div');
    return pin;
}

test('a new guess is announced; toggling the lights, reopening and a network error are not', async () => {
    const pin = makePin([]);
    await guess(pin, '1234', { feedback: { rightPlace: 1, rightNumber: 1 } });
    const lit = 'Guess 1, 1 2 3 4: 1 right digit in the right place, 1 right digit in the wrong place';
    assert.equal(pin.attemptsLiveElement.textContent, lit);

    // lights off: row text hides the pips, live region keeps what was announced
    pin.infoLeakToggleElement.checked = false;
    pin.updateAttemptsDisplay();
    assert.equal(pin.attemptsLogElement.querySelector('.pin-minigame-attempt').getAttribute('aria-label'), 'Guess 1, 1 2 3 4: incorrect');
    assert.equal(pin.attemptsLiveElement.textContent, lit);

    // reopen: a fresh live region stays empty although the log is re-rendered
    pin.attemptsLiveElement = document.createElement('div');
    pin.updateAttemptsDisplay();
    assert.equal(pin.attemptsLiveElement.textContent, '');

    // network error: no attempt recorded, region untouched
    pin.attemptsLiveElement.textContent = 'sentinel';
    await guess(pin, '5555', { networkError: true });
    assert.equal(pin.attempts.length, 1);
    assert.equal(pin.attemptsLiveElement.textContent, 'sentinel');

    // the next real guess is announced
    pin.infoLeakToggleElement.checked = true;
    await guess(pin, '9999', { feedback: { rightPlace: 0, rightNumber: 0 } });
    assert.equal(pin.attemptsLiveElement.textContent, 'Guess 2, 9 9 9 9: no right digits');
});

test('no cracker held: stored feedback is not spoken, on a guess or on reopen', () => {
    const pin = makeBare({ hasPinCracker: false });
    pin.attempts = [{ input: '1234', isCorrect: false, feedback: { rightPlace: 2, rightNumber: 1 } },
        { input: '0417', isCorrect: true, feedback: { rightPlace: 4, rightNumber: 0 } }];
    pin.updateAttemptsDisplay({ announce: true });
    const rows = pin.attemptsLogElement.querySelectorAll('.pin-minigame-attempt');
    assert.equal(rows[0].getAttribute('aria-label'), 'Guess 1, 1 2 3 4: incorrect');
    assert.equal(pin.attemptsLiveElement.textContent, 'Guess 2, 0 4 1 7: correct');
    assert.equal(pin.attemptsLogElement.querySelectorAll('.pin-minigame-feedback-lights').length, 0);
    assert.deepEqual(pin.getTestState().attemptSummaries, ['1 2 3 4: incorrect', '0 4 1 7: correct']);
});

test('infoLeakMode speaks the counts with feedback and says only incorrect without', () => {
    const pin = makeBare({ infoLeakMode: true });
    pin.attempts = [{ input: '1234', isCorrect: false, feedback: { rightPlace: 0, rightNumber: 2 } },
        { input: '4321', isCorrect: false, feedback: null }];
    pin.updateAttemptsDisplay({ announce: true });
    const rows = pin.attemptsLogElement.querySelectorAll('.pin-minigame-attempt');
    assert.equal(rows[0].getAttribute('aria-label'), 'Guess 1, 1 2 3 4: 2 right digits in the wrong place');
    assert.equal(rows[1].getAttribute('aria-label'), 'Guess 2, 4 3 2 1: incorrect');
    assert.equal(pin.attemptsLiveElement.textContent, 'Guess 2, 4 3 2 1: incorrect');
});

test('a plain keypad lock never gets pip text', async () => {
    const pin = makeBare();
    await guess(pin, '1234', { feedback: { rightPlace: 3, rightNumber: 0 } });
    assert.equal(pin.attempts[0].feedback, null);
    assert.equal(pin.attemptsLiveElement.textContent, 'Guess 1, 1 2 3 4: incorrect');
    assert.equal(pin.attemptsLogElement.querySelectorAll('.pin-minigame-feedback-lights').length, 0);
});
