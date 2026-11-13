// Object-unlock retry for a served-but-unearned route room (GATED_DOOR §3.6, Chunk A).
// notifyServerUnlock (systems/unlock-system.js) recognises a 403
// { reason: 'room_not_reachable', retryable: true } on an OBJECT unlock, awaits one
// window.stateSync.sync() (wrapped so a rejecting sync still proceeds) and re-posts the
// unlock exactly once. The function (and its helper unlockTargetId) is sliced out of the
// source so the test needs none of unlock-system's browser imports.
// Run with: node test/js/unlock-route-room-retry.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/systems/unlock-system.js');
const src = readFileSync(file, 'utf8');
const start = src.indexOf('export async function notifyServerUnlock');
const end = src.indexOf('function boundsOverlap');
assert.ok(start > 0 && end > start, 'could not find notifyServerUnlock');
globalThis.window = {};
const { notifyServerUnlock } = await import(
    'data:text/javascript;base64,' + Buffer.from(src.slice(start, end)).toString('base64'));

const refusal = () => {
    const err = new Error('API Error: 403');
    err.status = 403;
    err.body = { success: false, reason: 'room_not_reachable', retryable: true };
    return err;
};

// Build a fake ApiClient whose unlock() returns/throws from a queue of outcomes, counting calls.
function harness(outcomes, { sync } = {}) {
    const calls = { unlock: 0, sync: 0 };
    window.breakEscapeConfig = { gameId: 'g1' };
    window.ApiClient = {
        unlock: async () => {
            const outcome = outcomes[calls.unlock];
            calls.unlock += 1;
            if (outcome instanceof Error) throw outcome;
            return outcome;
        }
    };
    window.stateSync = {
        sync: async () => {
            calls.sync += 1;
            if (sync === 'reject') throw new Error('sync failed');
            return true;
        }
    };
    return calls;
}

const objectLockable = { scenarioData: { id: 'records_cabinet', type: 'cabinet' } };
const doorLockable = { doorProperties: { connectedRoom: 'secure_area' } };

test('object unlock retries once on a room_not_reachable body, then completes', async () => {
    const calls = harness([refusal(), { success: true, hasContents: false }]);
    const response = await notifyServerUnlock(objectLockable, 'object', 'key');
    assert.equal(calls.unlock, 2, 're-posts exactly once after the refusal');
    assert.equal(calls.sync, 1, 'flushes exactly one state sync before the re-post');
    assert.equal(response.success, true, 'the re-post answer is returned');
});

test('a forged object unlock stays refused after its one re-post (no loop)', async () => {
    const calls = harness([refusal(), refusal()]);
    const response = await notifyServerUnlock(objectLockable, 'object', 'key');
    assert.equal(calls.unlock, 2, 're-posts exactly once, then surfaces (no loop)');
    assert.equal(calls.sync, 1, 'syncs once');
    assert.equal(response, undefined, 'no success answer reaches the caller');
});

test('a rejecting re-sync still re-posts once', async () => {
    const calls = harness([refusal(), { success: true }], { sync: 'reject' });
    const response = await notifyServerUnlock(objectLockable, 'object', 'key');
    assert.equal(calls.sync, 1, 'the rejecting sync is still awaited once');
    assert.equal(calls.unlock, 2, 'the single re-post still fires after a rejecting sync');
    assert.equal(response.success, true);
});

test('no retry for a door, or for another refusal reason', async () => {
    // A door with a room_not_reachable body is never gated by §3.6: no retry.
    let calls = harness([refusal()]);
    await notifyServerUnlock(doorLockable, 'door', 'npc');
    assert.equal(calls.unlock, 1, 'a door is not retried');
    assert.equal(calls.sync, 0, 'a door triggers no sync');

    // An object refusal for a different reason is returned as today, no retry.
    const other = new Error('API Error: 422');
    other.status = 422;
    other.body = { success: false, message: 'Invalid attempt' };
    calls = harness([other]);
    const response = await notifyServerUnlock(objectLockable, 'object', 'pin');
    assert.equal(calls.unlock, 1, 'a non-room_not_reachable refusal is not retried');
    assert.equal(calls.sync, 0, 'no sync for an unrelated refusal');
    assert.equal(response, undefined);
});
