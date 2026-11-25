// A cancelled second step on a PASSWORD pad leaves its attempt count and lockout alone (S8c unit 27).
// password-minigame.js does `attempts++` before it asks the server and `attempts--` when the answer is a
// refusal of the lock's scope (second_step_cancelled is one), and saves the lock record after each. The first
// factor was right, so a cancel costs no attempt and refunds none: the net is zero. No edit to the pad.
// The real password pad, unlock-system.js, starters, ApiClient.unlock, lock-step.js, the pane and
// mfa-client.js run together; only the network is stubbed, from the shared answer fixture.
// Run with: bin/test-js test/js/lock-step-password-cancel.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStack, makeNetwork, settle, quickTimers, bootPage, payloads, deep } from './helpers/lock-step-real-stack.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const S = await buildStack();
const net = makeNetwork();
quickTimers();

const gateForDana = { name: 'gate_push', patch: (b) => { b.targetId = 'dana_cabinet'; b.npcId = 'dana'; } };
// the pad keys its lock record on the type handleUnlock was given: interactions.js gives 'item'
const status = () => S.password.passwordLockStatus('item:dana_cabinet');

function cabinet(extra = {}) {
    const data = { ...deep(payloads.startRoom.objects.find((o) => o.id === 'dana_cabinet')), ...extra };
    return { scenarioData: data, objectId: 'dana_cabinet', layer: 'L' };
}
const pad = () => window.MinigameFramework.currentMinigame;
async function enter(text) {
    pad().passwordField.value = text;
    const done = pad().submitPassword();
    await settle(10);
    return done;
}

test('the cabinet from the room payload is a password lock with a step (the pad under test)', () => {
    const o = cabinet().scenarioData;
    assert.equal(o.lockType, 'password');
    assert.deepEqual(o.secondStep, { kind: 'push_number_match', owner: 'dana' });
});

test('a denied step after a wrong guess: the count stays at 1, nothing is locked, the pad says nothing of attempts lost', async () => {
    const log = bootPage(S);
    S.password.clearPasswordLocks();
    net.reset({ '/unlock': ['first_factor_wrong', gateForDana], '/mfa/prompt': ['prompt_expired'] });
    const lockable = cabinet({ lockoutSeconds: 30, maxAttempts: 3 });
    window.handleUnlock(lockable, 'item');
    await settle();
    const p1 = pad();
    await enter('wrong-one');
    assert.equal(p1.gameData.attempts, 1);
    assert.deepEqual(status(), { attempts: 1, lockedLeftSeconds: 0 });
    await enter('right-one');
    await settle(20);
    assert.equal(log.toasts.filter((t) => t[0] === 'Not approved.').length, 1);
    assert.equal(p1.gameData.attempts, 1, 'the cancel is net zero on the pad');
    assert.deepEqual(status(), { attempts: 1, lockedLeftSeconds: 0 }, 'and on the saved lock record');
    assert.equal(lockable.scenarioData.locked, true);
});

test('a cancel at the last attempt does not lock the cabinet out', async () => {
    const log = bootPage(S);
    S.password.clearPasswordLocks();
    // maxAttempts 2: one wrong guess, then the right one, which is the 2nd attempt and would lock out if it counted
    net.reset({ '/unlock': ['first_factor_wrong', gateForDana], '/mfa/prompt': ['prompt_expired'] });
    const lockable = cabinet({ lockoutSeconds: 30, maxAttempts: 2 });
    window.handleUnlock(lockable, 'item');
    await settle();
    const p1 = pad();
    await enter('wrong-one');
    assert.deepEqual(status(), { attempts: 1, lockedLeftSeconds: 0 });
    await enter('right-one');
    await settle(20);
    assert.deepEqual(status(), { attempts: 1, lockedLeftSeconds: 0 }, 'one attempt left, no lockout');
    assert.equal(p1.gameData.attempts, 1);
});

test('the player closing the pane with X leaves the count and lockout alone too, and the next try can still open it', async () => {
    const log = bootPage(S);
    S.password.clearPasswordLocks();
    net.reset({ '/unlock': [gateForDana, gateForDana, 'open_object'], '/mfa/prompt': ['prompt_waiting', 'prompt_passed'] });
    const lockable = cabinet({ lockoutSeconds: 30, maxAttempts: 2 });
    window.handleUnlock(lockable, 'item');
    await settle();
    const p1 = pad();
    const first = enter('right-one');
    await settle(10);
    window.__test.lockStep.close();
    await first;
    await settle(20);
    assert.equal(log.toasts.some((t) => t[0] === 'Not approved.'), false);
    assert.equal(p1.gameData.attempts, 0, 'no attempt was spent');
    assert.deepEqual(status(), { attempts: 0, lockedLeftSeconds: 0 });
    // the pad closes itself as a cancel; the player asks again and this time the step passes
    await settle(20);
    window.handleUnlock(lockable, 'item');
    await settle();
    await enter('right-one');
    await settle(20);
    assert.equal(lockable.scenarioData.locked, false);
    assert.deepEqual(status(), { attempts: 0, lockedLeftSeconds: 0 });
});
