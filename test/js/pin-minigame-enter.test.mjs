// A second Enter while a PIN check is pending is ignored (m02 playtest F3):
// the auto-submit at full length plus a manual Enter used to burn two attempts.
// Run with: node --test test/js/pin-minigame-enter.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/pin/pin-minigame.js');
const dir = mkdtempSync(join(tmpdir(), 'pin-minigame-'));
mkdirSync(join(dir, 'pin'));
mkdirSync(join(dir, 'framework'));
writeFileSync(join(dir, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor() {} }\n');
writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'pin', 'pin-minigame.mjs'), readFileSync(src, 'utf8'));
globalThis.window = { ApiClient: {}, breakEscapeConfig: { gameId: 1 } };
const mod = await import(pathToFileURL(join(dir, 'pin', 'pin-minigame.mjs')).href);
const PinMinigame = mod.PinMinigame || Object.values(mod).find(v => typeof v === 'function' && v.prototype?.handleEnter);

function makePin() {
    const pin = Object.create(PinMinigame.prototype);
    Object.assign(pin, { isLocked: false, pinLength: 4, currentInput: '1234', attemptCount: 0, attempts: [], checkPending: false });
    pin.calls = 0;
    pin.validatePinWithServer = (input) => { pin.calls++; return new Promise(r => setTimeout(() => r(false), 20)); };
    pin.updateAttemptsDisplay = () => {};
    pin.updateDisplay = () => {};
    pin.handleFailure = () => { pin.currentInput = ''; };
    pin.handleSuccess = () => {};
    return pin;
}

test('two Enters during one pending check cost one attempt', async () => {
    const pin = makePin();
    await Promise.all([pin.handleEnter(), pin.handleEnter()]);
    assert.equal(pin.calls, 1);
    assert.equal(pin.attemptCount, 1);
    assert.equal(pin.attempts.length, 1);
});

test('input is ignored while a check is pending, and accepted after', async () => {
    const pin = makePin();
    const pending = pin.handleEnter();
    pin.handleBackspace();
    assert.equal(pin.currentInput, '1234');
    await pending;
    assert.equal(pin.checkPending, false);
    pin.currentInput = '12';
    globalThis.window.playUISound = () => {};
    pin.handleNumberInput('5');
    assert.equal(pin.currentInput, '125');
});
