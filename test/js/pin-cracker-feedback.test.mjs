// PIN cracker pips must agree with the server's verdict, and the cracker
// removes the attempt limit.
//
// m02 playtest bug: the real PIN never reaches the client, so the minigame's
// correctPin defaulted to '1234' and the pips were worked out against that.
// Typing 1234 at the boardroom (PIN 0417) lit four green pips while the server
// said "incorrect". The pips now come from the server's 422 body.
// Run with: node --test test/js/pin-cracker-feedback.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/pin/pin-minigame.js');
const dir = mkdtempSync(join(tmpdir(), 'pin-cracker-'));
mkdirSync(join(dir, 'pin'));
mkdirSync(join(dir, 'framework'));
writeFileSync(join(dir, 'framework', 'base-minigame.js'), `
export class MinigameScene {
    constructor(container, params) { this.container = container; this.params = params; }
    showFailure() {}
    showSuccess() {}
    getTestState() { return {}; }
}
`);
writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'pin', 'pin-minigame.mjs'), readFileSync(src, 'utf8'));

// Mastermind scoring as the server does it (Game.mastermind_feedback).
function score(secret, guess) {
    let rightPlace = 0;
    const spareSecret = [], spareGuess = [];
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === secret[i]) rightPlace++;
        else { spareGuess.push(guess[i]); spareSecret.push(secret[i]); }
    }
    let rightNumber = 0;
    for (const d of spareGuess) {
        const idx = spareSecret.indexOf(d);
        if (idx >= 0) { rightNumber++; spareSecret.splice(idx, 1); }
    }
    return { rightPlace, rightNumber };
}

// A server holding `secret`. It sends pips only when the player has a cracker.
function fakeServer(secret, { cracker = true } = {}) {
    return {
        calls: 0,
        async unlock(_type, _id, attempt) {
            this.calls++;
            if (attempt === secret) return { success: true };
            const err = new Error('Invalid attempt');
            err.status = 422;
            err.body = { success: false, message: 'Invalid attempt', ...(cracker ? { feedback: score(secret, attempt) } : {}) };
            throw err;
        }
    };
}

globalThis.window = { breakEscapeConfig: { gameId: 1 } };
const mod = await import(pathToFileURL(join(dir, 'pin', 'pin-minigame.mjs')).href);
const { PinMinigame, DEFAULT_PIN_MAX_ATTEMPTS, clearPinAttemptHistory } = mod;

function makePin({ secret = '0417', cracker = true, maxAttempts, lockId = 'conference_room', server } = {}) {
    window.ApiClient = server || fakeServer(secret, { cracker });
    const pin = new PinMinigame({}, {
        // what unlock-system.js passes: the PIN is withheld (server-side check)
        correctPin: null,
        pinLength: 4,
        hasPinCracker: cracker,
        maxAttempts,
        type: 'door',
        lockable: { doorProperties: { connectedRoom: lockId } }
    });
    pin.displayElement = { classList: { add() {}, remove() {} }, textContent: '' };
    pin.messageContainer = { querySelector: () => null };
    pin.infoLeakToggleElement = { checked: true };
    return pin;
}

async function guess(pin, code) {
    pin.currentInput = code;
    await pin.handleEnter();
    return pin.attempts.at(-1);
}

test('m02 repro: 1234 at a lock whose PIN is 0417 is wrong and does not light four green', async () => {
    clearPinAttemptHistory();
    const pin = makePin({ secret: '0417' });
    const a = await guess(pin, '1234');
    assert.equal(a.isCorrect, false);
    assert.deepEqual(a.feedback, { rightPlace: 0, rightNumber: 2 }); // 1 and 4, both misplaced
    assert.notEqual(a.feedback.rightPlace, 4);
});

test('pips agree with correctness for every guess (four green only when the server accepts)', async () => {
    for (const secret of ['0417', '1987', '1234', '0000', '9090']) {
        clearPinAttemptHistory();
        const pin = makePin({ secret, lockId: `lock_${secret}` });
        for (const g of ['1234', '0417', '1987', '4321', '0000', '9909', '0909', secret]) {
            if (pin.isLocked) break;
            const a = await guess(pin, g);
            assert.equal(a.isCorrect, g === secret, `${g} vs ${secret}`);
            assert.equal(a.feedback.rightPlace === 4, a.isCorrect, `pips for ${g} vs ${secret}: ${JSON.stringify(a.feedback)}`);
            if (!a.isCorrect) assert.deepEqual(a.feedback, score(secret, g));
        }
        assert.equal(pin.isLocked, true, 'right code opens it');
        assert.equal(pin.gameResult.success, true);
    }
});

test('no pips are invented when the server sends none (no client-side default PIN)', async () => {
    clearPinAttemptHistory();
    const pin = makePin({ secret: '0417', server: fakeServer('0417', { cracker: false }) });
    const a = await guess(pin, '1234');
    assert.equal(a.isCorrect, false);
    assert.equal(a.feedback, null);
    assert.equal(pin.correctPin, null);
});

test('with a PIN cracker there is no attempt limit', async () => {
    clearPinAttemptHistory();
    const pin = makePin({ secret: '0417', maxAttempts: 3 });
    assert.equal(pin.maxAttempts, Infinity);
    for (let i = 0; i < 25; i++) await guess(pin, '1111');
    assert.equal(pin.isLocked, false);
    assert.equal(pin.attemptCount, 25);
    assert.equal(pin.getTestState().maxAttempts, null);
    const a = await guess(pin, '0417');
    assert.equal(a.isCorrect, true);
});

test('without a cracker the default limit is raised to 5; a scenario value still wins', async () => {
    clearPinAttemptHistory();
    assert.equal(DEFAULT_PIN_MAX_ATTEMPTS, 5);
    const pin = makePin({ secret: '0417', cracker: false });
    assert.equal(pin.maxAttempts, 5);
    for (let i = 0; i < 4; i++) await guess(pin, '1111');
    assert.equal(pin.isLocked, false);
    await guess(pin, '1111');
    assert.equal(pin.isLocked, true);
    assert.equal(pin.gameResult.maxAttemptsReached, true);

    const strict = makePin({ secret: '0417', cracker: false, maxAttempts: 3, lockId: 'strict' });
    assert.equal(strict.maxAttempts, 3);
});

test('guesses and pips survive closing and reopening the same keypad, and are per lock', async () => {
    clearPinAttemptHistory();
    const first = makePin({ secret: '0417' });
    await guess(first, '1234');
    await guess(first, '5678');

    const reopened = makePin({ secret: '0417' });
    assert.equal(reopened.attempts.length, 2);
    assert.deepEqual(reopened.attempts.map(a => a.input), ['1234', '5678']);
    assert.deepEqual(reopened.attempts[0].feedback, { rightPlace: 0, rightNumber: 2 });
    assert.equal(reopened.attemptCount, 0, 'a fresh opening has its own attempt count');

    await guess(reopened, '0471');
    assert.equal(makePin({ secret: '0417' }).attempts.length, 3);

    const other = makePin({ secret: '1987', lockId: 'emergency_storage' });
    assert.equal(other.attempts.length, 0);
});
