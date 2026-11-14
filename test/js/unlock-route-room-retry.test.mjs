// Object-unlock retry for a served-but-unearned route room (GATED_DOOR §3.6).
// The retry is one shared helper, unlockWithRouteRoomRetry (utils/lock-scope-refusal.js): on a 403
// { reason: 'room_not_reachable', retryable: true } for an OBJECT unlock, it awaits one
// window.stateSync.sync() (wrapped so a rejecting sync still proceeds) and re-posts the unlock
// exactly once, preserving the original attempt and method. Every object-unlock path uses it:
// notifyServerUnlock (null-attempt methods) and the pin/password/combination/cryptex/flag
// minigames (their own code). This exercises the real helper and asserts the callers route
// through it (R1 MAJOR 2: the minigames used to post apiClient.unlock directly and skip the retry).
// Run with: node --test test/js/unlock-route-room-retry.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
// The helper's module (lock-scope-refusal.js) has no imports, so it loads directly.
const { unlockWithRouteRoomRetry } = await import(join(js, 'utils/lock-scope-refusal.js'));

const refusal = () => {
    const err = new Error('API Error: 403');
    err.status = 403;
    err.body = { success: false, reason: 'room_not_reachable', retryable: true };
    return err;
};

// A fake ApiClient whose unlock() returns/throws from a queue of outcomes, recording every call's
// args, plus a stateSync whose sync() counts calls (and may reject).
function harness(outcomes, { sync } = {}) {
    const calls = { unlock: 0, sync: 0, args: [] };
    globalThis.window = {
        ApiClient: {
            unlock: async (...args) => {
                calls.args.push(args);
                const outcome = outcomes[calls.unlock];
                calls.unlock += 1;
                if (outcome instanceof Error) throw outcome;
                return outcome;
            }
        },
        stateSync: {
            sync: async () => {
                calls.sync += 1;
                if (sync === 'reject') throw new Error('sync failed');
                return true;
            }
        }
    };
    return calls;
}

test('object unlock retries once on a room_not_reachable body, then completes', async () => {
    const calls = harness([refusal(), { success: true, hasContents: false }]);
    const response = await unlockWithRouteRoomRetry('object', 'records_cabinet', null, 'key');
    assert.equal(calls.unlock, 2, 're-posts exactly once after the refusal');
    assert.equal(calls.sync, 1, 'flushes exactly one state sync before the re-post');
    assert.equal(response.success, true, 'the re-post answer is returned');
});

test('a forged object unlock stays refused after its one re-post (no loop)', async () => {
    const calls = harness([refusal(), refusal()]);
    await assert.rejects(() => unlockWithRouteRoomRetry('object', 'records_cabinet', null, 'key'),
        /403/, 'the second refusal is re-thrown for the caller to surface');
    assert.equal(calls.unlock, 2, 're-posts exactly once, then surfaces (no loop)');
    assert.equal(calls.sync, 1, 'syncs once');
});

test('a rejecting re-sync still re-posts once', async () => {
    const calls = harness([refusal(), { success: true }], { sync: 'reject' });
    const response = await unlockWithRouteRoomRetry('object', 'records_cabinet', null, 'key');
    assert.equal(calls.sync, 1, 'the rejecting sync is still awaited once');
    assert.equal(calls.unlock, 2, 'the single re-post still fires after a rejecting sync');
    assert.equal(response.success, true);
});

test('no retry for a door, or for another refusal reason', async () => {
    // A door with a room_not_reachable body is never gated by §3.6: no retry, re-thrown.
    let calls = harness([refusal()]);
    await assert.rejects(() => unlockWithRouteRoomRetry('door', 'secure_area', null, 'rfid'), /403/);
    assert.equal(calls.unlock, 1, 'a door is not retried');
    assert.equal(calls.sync, 0, 'a door triggers no sync');

    // An object refusal for a different reason is re-thrown as today, no retry.
    const other = new Error('API Error: 422');
    other.status = 422;
    other.body = { success: false, message: 'Invalid attempt' };
    calls = harness([other]);
    await assert.rejects(() => unlockWithRouteRoomRetry('object', 'pinbox', '0000', 'pin'), /422/);
    assert.equal(calls.unlock, 1, 'a non-room_not_reachable refusal is not retried');
    assert.equal(calls.sync, 0, 'no sync for an unrelated refusal');
});

// R1 MAJOR 2: the pin and password paths post their own code and must be driven through the retry.
test('the pin path retries and preserves the entered code and method on the re-post', async () => {
    const calls = harness([refusal(), { success: true }]);
    const response = await unlockWithRouteRoomRetry('object', 'pinbox', '1234', 'pin');
    assert.equal(calls.unlock, 2, 'the pin re-post fires once');
    assert.deepEqual(calls.args[1].slice(0, 4), ['object', 'pinbox', '1234', 'pin'],
        'the re-post preserves the original attempt and method');
    assert.equal(response.success, true);
});

test('the password path retries and preserves the entered password and method on the re-post', async () => {
    const calls = harness([refusal(), { success: true }]);
    const response = await unlockWithRouteRoomRetry('object', 'pwbox', 'Secret1', 'password');
    assert.equal(calls.unlock, 2, 'the password re-post fires once');
    assert.deepEqual(calls.args[1].slice(0, 4), ['object', 'pwbox', 'Secret1', 'password'],
        'the re-post preserves the original attempt and method');
    assert.equal(response.success, true);
});

// Guard against a regression that reintroduces a direct apiClient.unlock bypass of the retry.
// The five minigames post their own code, so their object unlock must go through the helper and
// leave no bare apiClient.unlock behind. unlock-system.js uses the helper in notifyServerUnlock;
// its access-list rfid path (requestRfidAccessUnlock) is out of §3.6's scope and posts directly.
test('every object-unlock caller routes its POST through unlockWithRouteRoomRetry', () => {
    const minigames = [
        'minigames/pin/pin-minigame.js',
        'minigames/password/password-minigame.js',
        'minigames/combination/combination-minigame.js',
        'minigames/cryptex/cryptex-minigame.js',
        'minigames/flag-station/flag-station-minigame.js'
    ];
    for (const rel of minigames) {
        const src = readFileSync(join(js, rel), 'utf8');
        assert.ok(/unlockWithRouteRoomRetry\(/.test(src),
            `${rel} must POST its object unlock through unlockWithRouteRoomRetry`);
        assert.ok(!/apiClient\.unlock\(/.test(src), `${rel} must not post apiClient.unlock directly`);
    }
    const us = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
    assert.ok(/unlockWithRouteRoomRetry\(/.test(us),
        'notifyServerUnlock must route its object unlock through the shared retry helper');
});
