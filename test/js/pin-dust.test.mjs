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

test('without the kit, or with dustable false, the pad offers no Dust and asks nothing', async () => {
    for (const opts of [{ kit: false }, { dustable: false }]) {
        clearPinAttemptHistory();
        const server = fakeServer('4774');
        const pin = makePin({ ...opts, server });
        assert.equal(pin.getTestState().dustAvailable, false);
        await pin.restoreDust();
        assert.equal(server.calls.length, 0);
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

test('with the PIN cracker too, the cracker works inside the dusted keys (its search space shrinks)', async () => {
    clearPinAttemptHistory();
    const secret = '4774';
    const server = fakeServer(secret);
    server.unlock = null;
    const pin = makePin({ server, cracker: true });
    await pin.handleDust();
    // Everything a player can now type uses only 4 and 7: 2^4 = 16 codes, not 10^4
    const typeable = [];
    for (let n = 0; n < 10000; n++) {
        const code = String(n).padStart(4, '0');
        if (code.split('').every(d => !isKeyGreyed(d, pin.dustSet))) typeable.push(code);
    }
    assert.equal(typeable.length, 16);
    assert.ok(typeable.includes(secret));
    assert.equal(pin.getTestState().hasPinCracker, true);
});

test('dustSummary lists the digits in order', () => {
    assert.equal(dustSummary(new Set(['7', '4'])), 'Dust shows the code uses: 4 7. It does not show the order.');
    assert.equal(dustSummary(null), '');
});
