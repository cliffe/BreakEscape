// Dusting a PIN pad with the fingerprint kit: the Dust action greys every key that is not a
// digit of the PIN, the greyed keys take no input, and the PIN cracker keeps working inside the
// reduced key set. The pad only ever holds the digit set the server sends, never the PIN.
// Run with: node test/js/pin-dust.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/pin/pin-minigame.js');
const root = mkdtempSync(join(tmpdir(), 'pin-dust-'));
const dir = join(root, 'minigames');
mkdirSync(join(dir, 'pin'), { recursive: true });
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'utils', 'lock-scope-refusal.js'), readFileSync(join(here, '../../public/break_escape/js/utils/lock-scope-refusal.js'), 'utf8'));
mkdirSync(join(dir, 'framework'));
writeFileSync(join(dir, 'framework', 'base-minigame.js'), `
export class MinigameScene {
    constructor(container, params) { this.container = container; this.params = params; }
    showFailure() {}
    showSuccess() {}
    getTestState() { return {}; }
}
`);
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'pin', 'pin-minigame.mjs'), readFileSync(src, 'utf8'));

globalThis.window = { breakEscapeConfig: { gameId: 1 } };
const mod = await import(pathToFileURL(join(dir, 'pin', 'pin-minigame.mjs')).href);
const { PinMinigame, holdsFingerprintKit, dustDigitsFrom, isKeyGreyed, dustSummary, clearPinAttemptHistory } = mod;

// A bare key element: classList, dataset and attributes, as much as applyDust touches.
function fakeKey(digit) {
    const classes = new Set();
    return {
        dataset: { number: digit }, attrs: {},
        classList: { toggle(c, on) { on ? classes.add(c) : classes.delete(c); }, add: c => classes.add(c), has: c => classes.has(c) },
        setAttribute(k, v) { this.attrs[k] = v; }
    };
}

function makePin({ kit = true, dustable = true, server, lockId = 'safe_a', type = 'object', cracker = false } = {}) {
    window.ApiClient = server;
    const pin = new PinMinigame({}, {
        correctPin: null, pinLength: 4, hasFingerprintKit: kit, dustable, hasPinCracker: cracker, type,
        lockable: type === 'door' ? { doorProperties: { connectedRoom: lockId } } : { scenarioData: { id: lockId } }
    });
    const keys = '0123456789'.split('').map(fakeKey);
    pin.keypadElement = { querySelectorAll: () => keys };
    pin.displayElement = { classList: { add() {}, remove() {} }, textContent: '' };
    pin.dustButtonElement = { disabled: false, classList: { add() {} } };
    pin.dustNoteElement = { textContent: '' };
    pin.messageLineElement = { textContent: '', className: '' };
    pin.keys = keys;
    return pin;
}

// A server holding `secret` (4774): answers the sorted distinct digits, never the order.
function fakeServer(secret, { hint } = {}) {
    return {
        calls: [], stored: null,
        async pinDust(type, id, apply) {
            this.calls.push({ type, id, apply });
            if (apply) this.stored = [...new Set(secret.split(''))].sort();
            if (!this.stored) return { success: true, dusted: false };
            return { success: true, dusted: true, digits: this.stored, ...(hint ? { hint } : {}) };
        }
    };
}

test('holdsFingerprintKit reads the inventory the way the PIN cracker check does', () => {
    assert.equal(holdsFingerprintKit([{ scenarioData: { type: 'fingerprint_kit' } }]), true);
    assert.equal(holdsFingerprintKit([{ scenarioData: { type: 'pin-cracker' } }, null]), false);
    assert.equal(holdsFingerprintKit([]), false);
    assert.equal(holdsFingerprintKit(undefined), false);
});

test('dustDigitsFrom accepts only a dusted answer with digit characters', () => {
    assert.deepEqual([...dustDigitsFrom({ dusted: true, digits: ['4', '7'] })], ['4', '7']);
    assert.equal(dustDigitsFrom({ dusted: false }), null);
    assert.equal(dustDigitsFrom({ dusted: true, digits: [] }), null);
    assert.equal(dustDigitsFrom({ dusted: true, digits: ['a', '12'] }), null);
    assert.equal(dustDigitsFrom(null), null);
});

test('isKeyGreyed: nothing is greyed until dusted; then every digit outside the set is', () => {
    assert.equal(isKeyGreyed('3', null), false);
    const set = new Set(['4', '7']);
    assert.equal(isKeyGreyed('4', set), false);
    assert.equal(isKeyGreyed('3', set), true);
    assert.equal(isKeyGreyed('0', set), true);
    assert.equal(isKeyGreyed('DEL', set), false);
});

test('dusting greys exactly the digits not in the PIN, and repeated digits just work', async () => {
    clearPinAttemptHistory();
    const server = fakeServer('4774');
    const pin = makePin({ server });
    await pin.handleDust();
    assert.deepEqual(server.calls, [{ type: 'object', id: 'safe_a', apply: true }]);
    assert.deepEqual(pin.getTestState().greyedKeyDigits, ['0', '1', '2', '3', '5', '6', '8', '9']);
    assert.deepEqual(pin.getTestState().dustDigits, ['4', '7']);
    for (const k of pin.keys) {
        assert.equal(k.classList.has('pin-minigame-key-greyed'), !['4', '7'].includes(k.dataset.number), k.dataset.number);
        assert.equal(k.attrs['aria-disabled'], ['4', '7'].includes(k.dataset.number) ? 'false' : 'true');
    }
    assert.equal(pin.dustButtonElement.disabled, true, 'one time per lock');
    assert.match(pin.dustNoteElement.textContent, /4 7/);
    assert.match(pin.dustNoteElement.textContent, /not show the order/);
});

test('a greyed key takes no input; a lit key does, in any order', async () => {
    clearPinAttemptHistory();
    const pin = makePin({ server: fakeServer('4774') });
    await pin.handleDust();
    pin.handleNumberInput('3');
    pin.handleNumberInput('9');
    assert.equal(pin.currentInput, '');
    pin.handleNumberInput('7');
    pin.handleNumberInput('4');
    pin.handleNumberInput('0');
    assert.equal(pin.currentInput, '74');
});

test('dusting does not enter or reveal the order: the pad holds only the digit set', async () => {
    clearPinAttemptHistory();
    const pin = makePin({ server: fakeServer('4774') });
    await pin.handleDust();
    assert.equal(pin.currentInput, '');
    assert.equal(pin.correctPin, null);
    assert.equal(JSON.stringify(pin.getTestState()).includes('4774'), false);
});

test('a second press asks the server nothing more', async () => {
    clearPinAttemptHistory();
    const server = fakeServer('4774');
    const pin = makePin({ server });
    await pin.handleDust();
    await pin.handleDust();
    assert.equal(server.calls.length, 1);
});

test('a reload keeps it: reopening asks the server what the lock already showed', async () => {
    clearPinAttemptHistory();
    const server = fakeServer('4774');
    await makePin({ server }).handleDust();
    clearPinAttemptHistory(); // a page reload loses the session cache
    const reopened = makePin({ server });
    await reopened.restoreDust();
    assert.equal(server.calls.at(-1).apply, false);
    assert.deepEqual(reopened.getTestState().dustDigits, ['4', '7']);
    assert.equal(reopened.getTestState().greyedKeyDigits.length, 8);
});

test('reopening in the same session needs no request', async () => {
    clearPinAttemptHistory();
    const server = fakeServer('4774');
    await makePin({ server }).handleDust();
    const n = server.calls.length;
    const reopened = makePin({ server });
    await reopened.restoreDust();
    assert.equal(server.calls.length, n);
    assert.deepEqual(reopened.getTestState().dustDigits, ['4', '7']);
});

test('a lock never dusted opens undusted', async () => {
    clearPinAttemptHistory();
    const pin = makePin({ server: fakeServer('4774') });
    await pin.restoreDust();
    assert.equal(pin.dustSet, null);
    assert.deepEqual(pin.getTestState().greyedKeyDigits, []);
});

test('with dustable false the pad offers no Dust and asks nothing; without the kit it offers no button', async () => {
    for (const opts of [{ kit: false }, { dustable: false }]) {
        clearPinAttemptHistory();
        const server = fakeServer('4774');
        const pin = makePin({ ...opts, server });
        assert.equal(pin.getTestState().dustAvailable, false);
        await pin.restoreDust();
        // A non-dustable pad asks nothing; a kitless dustable one may only peek (never apply)
        assert.equal(server.calls.filter(c => c.apply).length, 0);
        if (opts.dustable === false) assert.equal(server.calls.length, 0);
    }
});

test('a server refusal leaves the pad as it was and says why', async () => {
    clearPinAttemptHistory();
    const err = Object.assign(new Error('no'), { status: 403, body: { reason: 'no_kit' } });
    const pin = makePin({ server: { async pinDust() { throw err; } } });
    await pin.handleDust();
    assert.equal(pin.dustSet, null);
    assert.match(pin.messageLineElement.textContent, /fingerprint kit/);
    assert.equal(pin.keys.some(k => k.classList.has('pin-minigame-key-greyed')), false);
});

test('a hint from the lock is shown with the dust summary', async () => {
    clearPinAttemptHistory();
    const pin = makePin({ server: fakeServer('4774', { hint: 'Worn keys, three of them.' }) });
    await pin.handleDust();
    assert.match(pin.dustNoteElement.textContent, /Worn keys, three of them\./);
});

test('a door pad dusts by the room it opens', async () => {
    clearPinAttemptHistory();
    const server = fakeServer('0602');
    await makePin({ server, type: 'door', lockId: 'vault' }).handleDust();
    assert.deepEqual(server.calls[0], { type: 'door', id: 'vault', apply: true });
});

test('with the PIN cracker too, a real attempt records the server pips and the dust survives it', async () => {
    clearPinAttemptHistory();
    const secret = '4774';
    const server = fakeServer(secret);
    const unlocks = [];
    // The server's answer to a wrong code: 422 with the cracker's pips (right place, right number)
    server.unlock = async (type, id, attempt) => {
        unlocks.push({ type, id, attempt });
        if (attempt === secret) return { success: true };
        let rightPlace = 0;
        const rest = [];
        const pool = [];
        for (let i = 0; i < 4; i++) { if (attempt[i] === secret[i]) rightPlace++; else { rest.push(attempt[i]); pool.push(secret[i]); } }
        let rightNumber = 0;
        for (const d of rest) { const k = pool.indexOf(d); if (k >= 0) { rightNumber++; pool.splice(k, 1); } }
        throw Object.assign(new Error('wrong'), { status: 422, body: { feedback: { rightPlace, rightNumber } } });
    };
    const pin = makePin({ server, cracker: true });
    assert.equal(pin.maxAttempts, Infinity, 'cracker: no attempt limit');
    await pin.handleDust();
    // Seven wrong codes in a row, all typed on the lit keys only; none locks the pad
    const guesses = ['4444', '7777', '4477', '7744', '4747', '7474', '4777'];
    for (const g of guesses) {
        for (const d of g) pin.handleNumberInput(d);
        assert.equal(pin.currentInput, g);
        await pin.handleEnter();
        assert.equal(pin.isLocked, false, `${g} must not lock the pad`);
        assert.equal(pin.currentInput, '');
        assert.deepEqual(pin.getTestState().greyedKeyDigits, ['0', '1', '2', '3', '5', '6', '8', '9'], 'dust survives a wrong code');
    }
    assert.equal(unlocks.length, 7);
    assert.equal(pin.attempts.length, 7);
    assert.equal(pin.getTestState().attemptsUsed, 7);
    assert.equal(pin.getTestState().maxAttempts, null);
    // Pips from the server: 4444 vs 4774 has the first and last in place; 4477 and 7744 have two
    // in place and the other two digits right but misplaced
    assert.deepEqual(pin.attempts[0].feedback, { rightPlace: 2, rightNumber: 0 });
    assert.deepEqual(pin.attempts[2].feedback, { rightPlace: 2, rightNumber: 2 });
    assert.deepEqual(pin.attempts[3].feedback, { rightPlace: 2, rightNumber: 2 });
    // The real code finishes it, with all-green pips
    for (const d of secret) pin.handleNumberInput(d);
    await pin.handleEnter();
    assert.equal(pin.attempts.at(-1).isCorrect, true);
    assert.deepEqual(pin.attempts.at(-1).feedback, { rightPlace: 4, rightNumber: 0 });
});

test('opt-in: a pad given no dustable flag never offers dust, even with a kit', async () => {
    clearPinAttemptHistory();
    window.ApiClient = fakeServer('4774');
    const pin = new PinMinigame({}, { pinLength: 4, hasFingerprintKit: true, lockable: { scenarioData: { id: 'safe_a' } } });
    assert.equal(pin.dustable, false);
    assert.equal(pin.getTestState().dustAvailable, false);
    await pin.restoreDust();
    assert.equal(window.ApiClient.calls.length, 0);
    const truthy = new PinMinigame({}, { pinLength: 4, hasFingerprintKit: true, dustable: 'yes', lockable: { scenarioData: { id: 'safe_a' } } });
    assert.equal(truthy.dustable, false, 'only a real true opts in');
});

test('a dusted pad is restored on reopening even when the kit is gone (greyed keys, note, no button)', async () => {
    clearPinAttemptHistory();
    const server = fakeServer('4774');
    await makePin({ server }).handleDust();
    clearPinAttemptHistory();
    const noKit = makePin({ kit: false, server });
    assert.equal(noKit.getTestState().dustAvailable, false, 'no button without the kit');
    await noKit.restoreDust();
    assert.deepEqual(noKit.getTestState().dustDigits, ['4', '7']);
    assert.equal(noKit.getTestState().greyedKeyDigits.length, 8);
    assert.match(noKit.dustNoteElement.textContent, /4 7/);
    // A lock that was never dusted stays clean without a kit
    const other = makePin({ kit: false, server: fakeServer('1357'), lockId: 'safe_b' });
    await other.restoreDust();
    assert.equal(other.dustSet, null);
});

test('dusting clears digits typed beforehand, so no impossible code is auto-submitted', async () => {
    clearPinAttemptHistory();
    const pin = makePin({ server: fakeServer('4774') });
    pin.handleNumberInput('5');
    pin.handleNumberInput('9');
    assert.equal(pin.currentInput, '59');
    await pin.handleDust();
    assert.equal(pin.currentInput, '');
    assert.equal(pin.displayElement.textContent, '____');
});

test('dust pressed while a code is being checked is ignored and the attempt keeps its code', async () => {
    clearPinAttemptHistory();
    const server = fakeServer('4774');
    let release;
    const gate = new Promise(r => { release = r; });
    server.unlock = async () => { await gate; throw Object.assign(new Error('wrong'), { status: 422, body: {} }); };
    const pin = makePin({ server });
    for (const d of '4444') pin.handleNumberInput(d);
    const check = pin.handleEnter();
    assert.equal(pin.checkPending, true);
    await pin.handleDust();
    assert.equal(server.calls.length, 0, 'no dust request mid-check');
    assert.equal(pin.dustSet, null, 'not dusted mid-check');
    // Even if the entry is cleared meanwhile, the record keeps the code that was checked
    pin.currentInput = '';
    release();
    await check;
    assert.equal(pin.attempts.length, 1);
    assert.equal(pin.attempts[0].input, '4444');
    // After the check the dust works
    await pin.handleDust();
    assert.equal(server.calls.length, 1);
});

test('a later successful dust clears the stale "does not take" message', async () => {
    clearPinAttemptHistory();
    const server = fakeServer('4774');
    let fail = true;
    const realDust = server.pinDust.bind(server);
    server.pinDust = async (...args) => {
        if (fail) { fail = false; throw Object.assign(new Error('x'), { status: 500, body: {} }); }
        return realDust(...args);
    };
    const pin = makePin({ server });
    await pin.handleDust();
    assert.match(pin.messageLineElement.textContent, /does not take/);
    await pin.handleDust();
    assert.equal(pin.messageLineElement.textContent, '');
    assert.deepEqual(pin.getTestState().dustDigits, ['4', '7']);
});

test('dustSummary lists the digits in order', () => {
    assert.equal(dustSummary(new Set(['7', '4'])), 'Dust shows the code uses: 4 7. It does not show the order.');
    assert.equal(dustSummary(null), '');
});

test('a fresh dust emits pin_dusted with the lock (no digits); a refusal or a reopen does not', async () => {
    clearPinAttemptHistory();
    const events = [];
    window.eventDispatcher = { emit: (name, data) => events.push({ name, data }) };
    try {
        const server = fakeServer('7041');
        await makePin({ server, lockId: 'p4_safe' }).handleDust();
        assert.deepEqual(events, [{ name: 'pin_dusted', data: { targetType: 'object', targetId: 'p4_safe' } }]);
        clearPinAttemptHistory();
        await makePin({ server, lockId: 'p4_safe' }).restoreDust();
        assert.equal(events.length, 1);
        const refusing = { async pinDust() { throw Object.assign(new Error('x'), { status: 422, body: { reason: 'not_dustable' } }); } };
        await makePin({ server: refusing, lockId: 'other' }).handleDust();
        assert.equal(events.length, 1);
    } finally {
        delete window.eventDispatcher;
    }
});

test('R1 m7: dust clicked while restoreDust is in flight neither dusts twice nor emits for a lock dusted before', async () => {
    clearPinAttemptHistory();
    const events = [];
    window.eventDispatcher = { emit: (name, data) => events.push({ name, data }) };
    try {
        const server = fakeServer('7041');
        await makePin({ server, lockId: 'p4_safe' }).handleDust();    // dusted before the "reload"
        events.length = 0;
        clearPinAttemptHistory();
        const pin = makePin({ server, lockId: 'p4_safe' });
        const restore = pin.restoreDust();                            // in flight
        const click = pin.handleDust();                               // before it settles
        await Promise.all([restore, click]);
        assert.deepEqual(events, [], 'a lock already dusted emits nothing again');
        assert.ok(pin.dustSet, 'still greyed');
    } finally {
        delete window.eventDispatcher;
    }
});

test('R1 m8: pin_dusted carries the object id, never the display name', async () => {
    clearPinAttemptHistory();
    const events = [];
    window.eventDispatcher = { emit: (name, data) => events.push({ name, data }) };
    try {
        const pin = makePin({ server: fakeServer('7041'), lockId: 'p4_safe' });
        pin.params.lockable = { scenarioData: { name: 'Archive safe' }, objectId: 'p4_safe_obj' };
        await pin.handleDust();
        assert.equal(events.length, 1);
        assert.equal(events[0].data.targetId, 'p4_safe_obj');
    } finally {
        delete window.eventDispatcher;
    }
});
