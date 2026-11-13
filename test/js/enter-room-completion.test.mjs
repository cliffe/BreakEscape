// enter_room server-validated completion: the client side (plan section 8.3, Chunk F).
//
// The server now checks an enter_room completion against its durable record of
// where the player has reached (player_reached_room?), refusing a forge with a
// `retryable` error. The client must never leave an honest player stranded:
//
//  - it pre-flushes the soft currentRoom sync before the completion POST, but the
//    completion does not depend on that sync landing (the durable unlockedRooms
//    write carries the server check), so a rejecting or absent pre-flush must not
//    block the POST;
//  - a `retryable` refusal re-syncs once (for ordering, never for success) and
//    re-posts once, then surfaces a genuine second refusal (a forge) without
//    looping;
//  - a transient/offline failure (the dominant path) and a thrown error feed a
//    bounded in-memory re-send queue keyed by task id, drained on the browser
//    `online` event and on the syncs the manager awaits, through the full
//    completeTask path so a mission-concluding completion still fires the end
//    screen.
//
// Run with: node test/js/enter-room-completion.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { querySelector: () => null };

const { ObjectivesManager } = await import(dataUrl(readFileSync(join(js, 'systems/objectives-manager.js'), 'utf8')));

function dispatcher() {
    const emitted = [];
    return { on() {}, emit(name, payload) { emitted.push({ name, payload }); }, emitted };
}

// An aim with one enter_room task on a room the player walks into.
function scenario() {
    return [{
        aimId: 'explore', title: 'Explore', status: 'active', order: 0,
        tasks: [{ taskId: 'enter_office', title: 'Enter the office', type: 'enter_room',
                  targetRoom: 'office1', status: 'active' }]
    }];
}

// A missionConclusion aim whose single enter_room task ends the mission.
function scenarioConcludes() {
    return [{
        aimId: 'finish', title: 'Finish', status: 'active', order: 0,
        missionConclusion: true,
        conclusionScreen: { type: 'bond_visualiser' },
        tasks: [{ taskId: 'enter_vault', title: 'Enter the vault', type: 'enter_room',
                  targetRoom: 'vault', status: 'active' }]
    }];
}

// Harness: a fetch double answering the completion POST from a queue of responses
// (or a per-call function), a logged stateSync.sync (resolve or reject), a gameAlert
// log, and a dispatchable `online` event so the queue drain can be exercised.
function harness(responses, { scn = scenario(), syncReject = false } = {}) {
    const order = [];
    const alerts = [];
    const onlineListeners = [];
    const disp = dispatcher();
    globalThis.window = {
        gameState: { globalVariables: {} },
        breakEscapeConfig: { gameId: 1 },
        gameAlert: (msg, kind, title) => alerts.push({ msg, kind, title }),
        stateSync: {
            sync: async () => {
                order.push('sync');
                if (syncReject) throw new Error('sync failed');
                return true;
            }
        },
        addEventListener: (type, fn) => { if (type === 'online') onlineListeners.push(fn); }
    };
    globalThis.document = { querySelector: () => null };
    let i = 0;
    const next = typeof responses === 'function'
        ? responses
        : () => { const r = responses[Math.min(i, responses.length - 1)]; i += 1; return r; };
    globalThis.fetch = async (url) => {
        order.push(`post:${url}`);
        const r = next();
        if (r && r.__throw) throw new Error('network down');
        if (r && r.__status5xx) return { status: 503, ok: false, json: async () => ({}) };
        return { status: 200, ok: true, json: async () => r };
    };
    const m = new ObjectivesManager(disp);
    m.initialize(scn);
    const fireOnline = () => Promise.all(onlineListeners.map(fn => fn()));
    return { m, order, alerts, disp, fireOnline };
}

test('pre-flush: the sync runs before the completion POST and the POST fires once', async () => {
    const { m, order } = harness([{ success: true }]);

    await m.completeTask('enter_office');

    const firstSync = order.indexOf('sync');
    const firstPost = order.findIndex(e => e.startsWith('post:'));
    assert.ok(firstSync !== -1, 'the client pre-flushed before completing');
    assert.ok(firstSync < firstPost, 'the pre-flush runs before the completion POST');
    assert.equal(order.filter(e => e.startsWith('post:')).length, 1, 'exactly one completion POST');
    assert.equal(m.taskIndex['enter_office'].status, 'completed');
});

test('the completion does not depend on the pre-flush: a rejecting sync still posts and completes', async () => {
    const { m, order } = harness([{ success: true }], { syncReject: true });

    await m.completeTask('enter_office');

    assert.ok(order.some(e => e.startsWith('post:')), 'the completion POST was still sent');
    assert.equal(m.taskIndex['enter_office'].status, 'completed',
        'a rejecting pre-flush does not block the honest completion');
});

test('a retryable refusal re-syncs once and re-posts once, then self-heals when the room becomes durable', async () => {
    // First completion refused (durable membership not yet visible), re-post succeeds.
    const { m, order } = harness([
        { success: false, error: 'Room not reached', retryable: true },
        { success: true }
    ]);

    await m.completeTask('enter_office');

    assert.equal(order.filter(e => e.startsWith('post:')).length, 2, 'the client re-posted exactly once');
    // sync before the first post (pre-flush) and again before the re-post.
    assert.ok(order.filter(e => e === 'sync').length >= 2, 'the re-sync ran before the re-post');
    assert.equal(m.taskIndex['enter_office'].status, 'completed', 'the honest ordering gap healed');
});

test('a forge stays refused after one re-post and surfaces once, without looping', async () => {
    const { m, order, alerts } = harness([
        { success: false, error: 'Room not reached', retryable: true }
    ]);

    await m.completeTask('enter_office');

    assert.equal(order.filter(e => e.startsWith('post:')).length, 2, 'the client re-posted exactly once, then stopped');
    assert.equal(m.taskIndex['enter_office'].status, 'active', 'the forged task stays active');
    const blocked = alerts.filter(a => a.title === 'Objective Blocked');
    assert.equal(blocked.length, 1, 'the refusal surfaces exactly once');
});

test('a retryable refusal with a rejecting re-sync still re-posts once', async () => {
    const { m, order } = harness([
        { success: false, error: 'Room not reached', retryable: true },
        { success: true }
    ], { syncReject: true });

    await m.completeTask('enter_office');

    assert.equal(order.filter(e => e.startsWith('post:')).length, 2,
        'the rejecting re-sync did not swallow the re-post');
    assert.equal(m.taskIndex['enter_office'].status, 'completed');
});

test('a retryable re-post that then drops offline is queued, not surfaced as a hard refusal (R9 minor 1)', async () => {
    // First refused retryable; the single re-post drops offline (transient).
    const { m, alerts } = harness([
        { success: false, error: 'Room not reached', retryable: true },
        { __throw: true }
    ]);

    await m.completeTask('enter_office');

    assert.ok(m.enterRoomQueue.has('enter_office'), 'the transient re-post was enqueued');
    assert.equal(m.taskIndex['enter_office'].status, 'active');
    assert.equal(alerts.filter(a => a.title === 'Objective Blocked').length, 0,
        'no hard "Room not reached" block is shown on a transient re-post');
});

test('a genuine non-transient refusal is not queued and surfaces', async () => {
    const { m, alerts } = harness([{ success: false, error: 'Nope' }]);

    await m.completeTask('enter_office');

    assert.equal(m.enterRoomQueue.size, 0, 'a plain refusal does not enter the queue');
    assert.equal(alerts.filter(a => a.title === 'Objective Blocked').length, 1);
    assert.equal(m.taskIndex['enter_office'].status, 'active');
});

test('offline feed and reconnect drain: a transient failure queues, the online event re-posts and completes', async () => {
    // The completion POST 5xxes on every attempt of the retry loop, then succeeds on the drain.
    let offline = true;
    const { m, fireOnline } = harness(() => (offline ? { __status5xx: true } : { success: true }));

    await m.completeTask('enter_office');
    assert.ok(m.enterRoomQueue.has('enter_office'),
        'the transient/offline completion entered the queue from the dominant path');
    assert.equal(m.taskIndex['enter_office'].status, 'active');

    offline = false;
    await fireOnline();

    assert.equal(m.taskIndex['enter_office'].status, 'completed', 'the online drain re-posted and completed');
    assert.equal(m.enterRoomQueue.size, 0, 'the queue drops the entry on success');
});

test('re-queuing the same task id does not grow the queue', async () => {
    const { m } = harness([{ success: true }]);
    m.enqueueEnterRoom('enter_office');
    m.enqueueEnterRoom('enter_office');
    m.enqueueEnterRoom('enter_office');
    assert.equal(m.enterRoomQueue.size, 1, 'the Set holds at most one entry per task id');
});

test('a thrown error also feeds the queue', async () => {
    const { m } = harness([{ success: true }]);
    // Force the outer catch: WithRetry throws (not a plain network drop, which
    // serverCompleteTask turns into a transient return).
    m.serverCompleteTaskWithRetry = async () => { throw new Error('boom'); };

    await m.completeTask('enter_office');

    assert.ok(m.enterRoomQueue.has('enter_office'), 'a thrown completion entered the queue');
    assert.equal(m.taskIndex['enter_office'].status, 'active');
});

test('a drained entry whose re-post is a non-transient refusal is dropped, not retried forever', async () => {
    // Seed the queue directly, then drain against a permanent refusal.
    const { m } = harness([{ success: false, error: 'Room not reached', retryable: true }]);
    m.enqueueEnterRoom('enter_office');

    await m.drainEnterRoomQueue();

    assert.equal(m.enterRoomQueue.size, 0, 'the drained entry is dropped on a not-transient refusal');
    assert.equal(m.taskIndex['enter_office'].status, 'active');
});

test('a queued completion that concludes a mission still fires the end screen on drain', async () => {
    let offline = true;
    const { m, disp, fireOnline } = harness(
        () => (offline ? { __status5xx: true } : { success: true, missionConcluded: true }),
        { scn: scenarioConcludes() }
    );

    await m.completeTask('enter_vault');
    assert.ok(m.enterRoomQueue.has('enter_vault'), 'the conclude completion queued while offline');

    offline = false;
    await fireOnline();

    assert.ok(disp.emitted.some(e => e.name === 'mission_concluded'),
        'the drained re-post fired the mission-concluded end-screen path');
    assert.equal(m.taskIndex['enter_vault'].status, 'completed');
});
