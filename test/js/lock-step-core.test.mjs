// Lock second step core (ops layer S8c unit 08): outcomes, the re-post, the npc wait, one pane at
// a time, cancel feedback, door opener. Server answers come from the shared fixture only.
// Run with: node test/js/lock-step-core.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { loadAnswer } from './helpers/lock-step-answers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const L = await import(pathToFileURL(join(here, '../../public/break_escape/js/systems/lock-step.js')).href);

const ans = (name) => loadAnswer(name).body;
const tick = () => new Promise((r) => setImmediate(r));

function deferred() {
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    return { promise, resolve };
}

function setup(over = {}) {
    L.reset();
    const log = { posts: [], panes: [], toasts: [], tones: 0, timers: [], openers: [], writes: [], noted: [] };
    let ts = 100;
    const replies = over.replies || [ans('open_object')];
    const clears = over.clears || [];
    const env = {
        mfa: { noteRequired: (s, b) => log.noted.push([s, b]) },
        post: async (path, body) => { log.posts.push({ path, body }); const r = replies.shift(); if (r instanceof Error) throw r; return r; },
        nextClientTs: () => ++ts,
        applyServerWrites: (a, t) => log.writes.push(t),
        openPane: (ctx) => { const d = deferred(); const p = { ctx, d, done: d.promise, close() {} }; log.panes.push(p); return p; },
        isClear: () => (clears.length ? clears.shift() : true),
        isOpenInClient: over.isOpenInClient || (() => false),
        setTimer: (f, ms) => log.timers.push({ f, ms }),
        clearTimer: () => {},
        toast: (t) => log.toasts.push(t),
        rejectTone: () => { log.tones += 1; },
        writeOpener: (id, who) => log.openers.push([id, who])
    };
    L.configure(env);
    return log;
}

const request = { targetType: 'object', targetId: 'moira_locker', attempt: 'x', method: 'password' };

test('passed: re-posts the same body once through post with a new timestamp', async () => {
    const log = setup();
    const p = L.run(ans('gate_push'), request);
    await tick();
    assert.equal(log.panes.length, 1);
    assert.equal(log.panes[0].ctx.subject, 'object:moira_locker');
    assert.equal(log.posts.length, 0);
    log.panes[0].d.resolve('passed');
    const final = await p;
    assert.equal(final.success, true);
    assert.equal(log.posts.length, 1);
    assert.deepEqual(log.posts[0].body, request);
    assert.equal(log.writes[0], 101);
    assert.equal(log.noted.length, 1);
});

test('passed but the answer is a second step again: cancel, not by the player', async () => {
    const log = setup({ replies: [ans('gate_push')] });
    const p = L.run(ans('gate_push'), request);
    await tick();
    log.panes[0].d.resolve('passed');
    await assert.rejects(p, (e) => L.isCancel(e) && e.body.closedByPlayer === false && e.status === 403);
});

for (const [outcome, byPlayer] of [['denied', false], ['expired', false], ['closed', true]]) {
    test(`${outcome} rejects with closedByPlayer ${byPlayer} and no re-post`, async () => {
        const log = setup();
        const p = L.run(ans('gate_number'), request);
        await tick();
        assert.equal(log.panes[0].ctx.number, ans('gate_number').number);
        log.panes[0].d.resolve(outcome);
        await assert.rejects(p, (e) => L.isCancel(e) && e.body.closedByPlayer === byPlayer);
        assert.equal(log.posts.length, 0);
    });
}

test('a pane that fails to open is a silent cancel', async () => {
    const log = setup();
    L.configure({ ...{}, post: async () => ({}), openPane: () => { throw new Error('boom'); }, mfa: { noteRequired() {} }, isClear: () => true });
    await assert.rejects(L.run(ans('gate_push'), request), (e) => L.isCancel(e) && e.body.closedByPlayer === true);
    assert.equal(log.panes.length, 0);
});

test('npc method: clear at once opens at once with no toast', async () => {
    const log = setup({ clears: [true] });
    const p = L.run(ans('gate_push'), { ...request, method: 'npc' });
    await tick();
    assert.equal(log.panes.length, 1);
    assert.equal(log.toasts.length, 0);
    log.panes[0].d.resolve('closed');
    await assert.rejects(p, L.isCancel);
});

test('npc method: not clear, then clear twice in a row, toast once', async () => {
    const log = setup({ clears: [false, true, false, true, true] });
    const p = L.run(ans('gate_push'), { ...request, method: 'npc' });
    await tick();
    assert.equal(log.panes.length, 0);
    assert.deepEqual(log.toasts, ['Second step pending. It opens when you finish here.']);
    for (let i = 0; i < 4; i++) {
        assert.equal(log.panes.length, 0);
        assert.equal(log.timers.at(-1).ms, 400);
        log.timers.pop().f();
        await tick();
    }
    assert.equal(log.panes.length, 1);
    assert.equal(log.toasts.length, 1);
    log.panes[0].d.resolve('closed');
    await assert.rejects(p, L.isCancel);
});

test('fromDoor not clear asks once and settles as a silent cancel', async () => {
    const log = setup({ clears: [false] });
    await assert.rejects(L.run(ans('gate_door_npc'), { ...request, method: 'npc' }, { fromDoor: true }),
        (e) => L.isCancel(e) && e.body.closedByPlayer === true);
    assert.equal(log.panes.length, 0);
    assert.equal(log.toasts.length, 0);
    assert.equal(log.timers.length, 0);
});

test('two requests give two panes in turn, the second re-posting its own body at the head', async () => {
    const second = { targetType: 'object', targetId: 'priya_safe', attempt: 'y', method: 'pin' };
    const log = setup({ replies: [ans('gate_number'), ans('open_object')] });
    const p1 = L.run(ans('gate_push'), request);
    const p2 = L.run(ans('gate_number'), second);
    await tick();
    assert.equal(log.panes.length, 1);
    assert.equal(log.posts.length, 0);
    log.panes[0].d.resolve('closed');
    await assert.rejects(p1, L.isCancel);
    await tick();
    assert.equal(log.posts.length, 1);
    assert.deepEqual(log.posts[0].body, second);
    assert.equal(log.panes.length, 2);
    assert.equal(log.panes[1].ctx.targetId, 'priya_safe');
    log.panes[1].d.resolve('passed');
    const final = await p2;
    assert.equal(final.success, true);
    assert.equal(log.posts.length, 2);
});

test('a queued request whose fresh answer is a success settles as a pass with no pane', async () => {
    const log = setup({ replies: [ans('open_object')] });
    const p1 = L.run(ans('gate_push'), request);
    const p2 = L.run(ans('gate_push'), request);
    await tick();
    log.panes[0].d.resolve('closed');
    await assert.rejects(p1, L.isCancel);
    const final = await p2;
    assert.equal(final.success, true);
    assert.equal(log.panes.length, 1);
});

test('a queued request whose target is already open settles as a silent cancel', async () => {
    const log = setup({ isOpenInClient: () => true });
    const p1 = L.run(ans('gate_push'), request);
    const p2 = L.run(ans('gate_push'), request);
    await tick();
    log.panes[0].d.resolve('closed');
    await assert.rejects(p1, L.isCancel);
    await assert.rejects(p2, (e) => L.isCancel(e) && e.body.closedByPlayer === true);
    assert.equal(log.panes.length, 1);
});

test('cancelFeedback: a deny or expiry gives the tone and the line, the player X gives nothing', async () => {
    const log = setup();
    const p = L.run(ans('gate_push'), request);
    await tick();
    log.panes[0].d.resolve('denied');
    const denied = await p.catch((e) => e);
    assert.equal(L.cancelFeedback(denied), true);
    assert.equal(log.tones, 1);
    assert.deepEqual(log.toasts, ['Not approved.']);
    const closed = Object.assign(new Error('x'), { status: 403, body: { success: false, reason: 'second_step_cancelled', closedByPlayer: true } });
    assert.equal(L.cancelFeedback(closed), false);
    assert.equal(log.tones, 1);
    assert.equal(log.toasts.length, 1);
    assert.equal(L.isCancel(new Error('other')), false);
});

test('writeOpener only for a door answer with an opener', async () => {
    const log = setup();
    const door = L.run(ans('gate_door_npc'), { targetType: 'door', targetId: 'records_room', method: 'password' });
    await tick();
    assert.deepEqual(log.openers, [['records_room', 'moira']]);
    log.panes[0].d.resolve('closed');
    await door.catch(() => {});
    await tick();
    const obj = L.run(ans('gate_push'), request);
    await tick();
    log.panes[1].d.resolve('closed');
    await obj.catch(() => {});
    assert.equal(log.openers.length, 1);
});
