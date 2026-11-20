// Door set-up must wait for the room's real load, not a fixed delay (F19).
// m10's core room took over a second (large ink story + NPC textures), so the
// old 20 x 50ms poll gave up with a console error.
// Run with: node --test test/js/room-ready-wait.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const { waitForRoomReady, ROOM_READY_TIMEOUT_MS } =
    await import(pathToFileURL(join(js, 'systems/room-ready.js')).href);

test('a room that takes longer than the old 1 second poll is still waited for', async () => {
    const rooms = {};
    const load = new Promise(r => setTimeout(() => { rooms.core = { doorSprites: [] }; r(); }, 1300));
    const out = await waitForRoomReady(() => rooms.core, load);
    assert.equal(out.ready, true);
    assert.equal(out.timedOut, false);
    assert.ok(out.waitedMs >= 1250, `waited ${out.waitedMs}ms`);
});

test('resolves as soon as the load promise settles, not on a poll tick', async () => {
    const rooms = {};
    const load = Promise.resolve().then(() => { rooms.a = { doorSprites: [] }; });
    const out = await waitForRoomReady(() => rooms.a, load, { pollMs: 5000 });
    assert.equal(out.ready, true);
    assert.ok(out.waitedMs < 500);
});

test('a failed load resolves promptly as not ready', async () => {
    const out = await waitForRoomReady(() => undefined, Promise.reject(new Error('x')));
    assert.equal(out.ready, false);
    assert.equal(out.timedOut, false);
});

test('without a load promise it polls, then times out', async () => {
    const rooms = {};
    setTimeout(() => { rooms.b = { doorSprites: [] }; }, 120);
    const ok = await waitForRoomReady(() => rooms.b, null, { pollMs: 10, timeoutMs: 2000 });
    assert.equal(ok.ready, true);
    const bad = await waitForRoomReady(() => undefined, null, { pollMs: 10, timeoutMs: 100 });
    assert.deepEqual([bad.ready, bad.timedOut], [false, true]);
});

test('the timeout backstop is generous', () => {
    assert.ok(ROOM_READY_TIMEOUT_MS >= 10000);
});

test('doors.js uses the helper and no longer has the fixed 20 x 50ms poll', () => {
    const src = readFileSync(join(js, 'systems/doors.js'), 'utf8');
    assert.match(src, /waitForRoomReady\(/);
    assert.doesNotMatch(src, /maxAttempts\s*=\s*20/);
});
