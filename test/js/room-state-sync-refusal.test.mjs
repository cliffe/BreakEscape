// postRoomAction tells a true server refusal apart from a transport error
// (review R2 m4): a definite 4xx refusal (or a parsed success:false) returns false,
// so a carry caller reconciles; a 5xx/408/429 or a dropped response returns null, so
// the caller keeps its optimistic state for the next room fetch.
// Run with: node --test test/js/room-state-sync-refusal.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { carryObject } from '../../public/break_escape/js/systems/room-state-sync.js';

globalThis.window = { breakEscapeConfig: { gameId: 1 } };
globalThis.document = { querySelector: () => null };
const quiet = { log() {}, warn() {}, error() {} };
globalThis.console = { ...console, ...quiet };

function mockFetch(behaviour) {
    globalThis.fetch = async () => {
        if (behaviour.throw) throw new Error('network down');
        return {
            ok: behaviour.status >= 200 && behaviour.status < 300,
            status: behaviour.status,
            json: async () => behaviour.body ?? {}
        };
    };
}

test('a committed success returns true', async () => {
    mockFetch({ status: 200, body: { success: true } });
    assert.equal(await carryObject('grace', 'office_mugs', 'office'), true);
});

test('a 422 refusal returns false so the client reconciles', async () => {
    mockFetch({ status: 422, body: { success: false, message: 'not carriable' } });
    assert.equal(await carryObject('grace', 'office_mugs', 'office'), false);
});

test('a parsed success:false on a 200 returns false', async () => {
    mockFetch({ status: 200, body: { success: false, message: 'refused' } });
    assert.equal(await carryObject('grace', 'office_mugs', 'office'), false);
});

test('a 500 is transient and returns null, not a refusal', async () => {
    mockFetch({ status: 500, body: {} });
    assert.equal(await carryObject('grace', 'office_mugs', 'office'), null);
});

test('a 429 rate limit is transient and returns null', async () => {
    mockFetch({ status: 429, body: {} });
    assert.equal(await carryObject('grace', 'office_mugs', 'office'), null);
});

test('a dropped response (network throw) returns null, not false', async () => {
    mockFetch({ throw: true });
    assert.equal(await carryObject('grace', 'office_mugs', 'office'), null);
});
