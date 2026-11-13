// loadRoom (core/rooms.js): asking for a room that is already loaded does nothing
// (no fetch, no createRoom, the existing room object is kept). loadRoom is sliced out
// of the source and run with stubbed collaborators, because rooms.js needs Phaser.
// Run with: node test/js/load-room-idempotent.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/core/rooms.js');
const src = readFileSync(file, 'utf8');
const start = src.indexOf('async function loadRoom(roomId)');
const end = src.indexOf('export function initializeRooms');
assert.ok(start > 0 && end > start, 'could not find loadRoom');
const body = src.slice(start, end);

function build() {
    const calls = { fetch: [], create: [], reveal: [], npc: [] };
    const roomDataCache = new Map();
    globalThis.window = {
        roomPositions: { vault: { x: 0, y: 0 }, annex: { x: 0, y: 0 } },
        rooms: {},
        breakEscapeConfig: { gameId: 9 },
        npcLazyLoader: { loadNPCsForRoom: async (id) => { calls.npc.push(id); } }
    };
    globalThis.fetch = async (url) => { calls.fetch.push(url); return { ok: true, json: async () => ({ room: { type: 'room_office' } }) }; };
    const createRoom = (id) => { calls.create.push(id); window.rooms[id] = { id, created: calls.create.length }; };
    const revealRoom = (id) => { calls.reveal.push(id); };
    const loadRoom = new Function('roomDataCache', 'createRoom', 'revealRoom', 'roomLoadsInFlight',
        `${body}; return loadRoom;`)(roomDataCache, createRoom, revealRoom, new Map());
    return { loadRoom, calls, roomDataCache };
}

const quiet = { log: console.log, error: console.error };
const silent = async (fn) => { console.log = () => {}; console.error = () => {}; try { return await fn(); } finally { Object.assign(console, quiet); } };

test('the first call fetches the room once and creates it', async () => {
    const { loadRoom, calls } = build();
    await silent(() => loadRoom('vault'));
    assert.deepEqual(calls.fetch, ['/break_escape/games/9/room/vault']);
    assert.deepEqual(calls.create, ['vault']);
    assert.deepEqual(calls.npc, ['vault']);
    assert.deepEqual(calls.reveal, ['vault']);
});

test('a second call for a loaded room does nothing: same room object, no fetch, no create, no reveal', async () => {
    const { loadRoom, calls } = build();
    await silent(() => loadRoom('vault'));
    const first = window.rooms.vault;
    await silent(() => loadRoom('vault'));
    await silent(() => loadRoom('vault'));
    assert.equal(window.rooms.vault, first);
    assert.equal(calls.fetch.length, 1);
    assert.equal(calls.create.length, 1);
    assert.equal(calls.reveal.length, 1);
    assert.equal(calls.npc.length, 1);
});

test('a room that is already in window.rooms is never fetched (a door reopened to a loaded room)', async () => {
    const { loadRoom, calls, roomDataCache } = build();
    const existing = { id: 'annex', player: 'was-here' };
    window.rooms.annex = existing;
    roomDataCache.set('annex', { type: 'room_office' });
    await silent(() => loadRoom('annex'));
    assert.equal(window.rooms.annex, existing);
    assert.deepEqual(calls.fetch, []);
    assert.deepEqual(calls.create, []);
    assert.equal(roomDataCache.has('annex'), true, 'the unlock cache is left alone');
});

test('a room with no known position is refused without a fetch', async () => {
    const { loadRoom, calls } = build();
    await silent(() => loadRoom('nowhere'));
    assert.deepEqual(calls.fetch, []);
    assert.deepEqual(calls.create, []);
});

test('unlock-response data is used instead of a fetch, and consumed', async () => {
    const { loadRoom, calls, roomDataCache } = build();
    roomDataCache.set('vault', { type: 'room_office' });
    await silent(() => loadRoom('vault'));
    assert.deepEqual(calls.fetch, []);
    assert.deepEqual(calls.create, ['vault']);
    assert.equal(roomDataCache.has('vault'), false);
});

// Two callers racing (a route NPC's unlock action and the player's door click) share one
// in-flight load: one fetch, one NPC load, one createRoom.
test('two simultaneous calls fetch once', async () => {
    const { loadRoom, calls } = build();
    await silent(() => Promise.all([loadRoom('vault'), loadRoom('vault')]));
    assert.equal(calls.fetch.length, 1);
    assert.equal(calls.npc.length, 1);
    assert.equal(calls.create.length, 1);
    assert.equal(calls.reveal.length, 1);
});

test('a failed load can be retried', async () => {
    const { loadRoom, calls } = build();
    const okFetch = globalThis.fetch;
    globalThis.fetch = async (url) => { calls.fetch.push(url); return { ok: false, status: 500, statusText: 'boom' }; };
    await silent(() => Promise.all([loadRoom('vault'), loadRoom('vault')]));
    assert.equal(calls.fetch.length, 1, 'the racing callers shared the failed attempt');
    assert.equal(window.rooms.vault, undefined);
    globalThis.fetch = okFetch;
    await silent(() => loadRoom('vault'));
    assert.equal(calls.fetch.length, 2);
    assert.deepEqual(calls.create, ['vault']);
});
