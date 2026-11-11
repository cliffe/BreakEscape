// The workaround runner (systems/npc-workarounds.js, ACCESS_MODEL_SLICE_9_2_PLAN.md section 6,
// sub-slice B), with a stub API: each kind starts the right visit, says its start line, emits
// started then done and applies its answer; a dropped visit is reported dropped; a failed "done"
// is resent and its answer applied once; a 425 is retried after the dwell; a pending workaround
// from a load is started once, when its NPC registers; done setGlobals are applied on a load;
// emit fires its event and then confirms. The needs side runs on fixtures/needs-work-world.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NpcWorkarounds, openProppedDoor, START_POOLS, installNpcWorkarounds, retryDelay, RETRY_MAX_MS } from '../../public/break_escape/js/systems/npc-workarounds.js';
import { workWorld, baseObjects, dana } from './fixtures/needs-work-world.mjs';

function stub({ answers = {}, failures = [] } = {}) {
    const calls = { sends: [], emits: [], globals: [], postits: [], doors: [], mutters: [], visits: [], timers: [] };
    const needs = {
        mutter: (id, topic) => { calls.mutters.push([id, topic]); return true; },
        enqueueVisit: (id, v) => { calls.visits.push([id, v]); return true; }
    };
    const fails = [...failures];
    const runner = new NpcWorkarounds({
        send: async body => {
            calls.sends.push(body);
            const f = fails.shift();
            if (f) { const e = new Error('x'); e.status = f.status; e.body = f.body; throw e; }
            return answers[body.npc_id] ?? {};
        },
        needs: () => needs,
        emit: (name, data) => calls.emits.push({ name, data }),
        setGlobal: (n, v) => calls.globals.push([n, v]),
        markPostit: (pc, on) => calls.postits.push([pc, on]),
        openDoor: (room, data) => calls.doors.push([room, data]),
        npcRecord: id => ({ mei: { needsHome: 'mei_pc' }, tom: { needsHome: 'tom_pc' } }[id] || null),
        setTimer: (fn, ms) => calls.timers.push({ fn, ms })
    });
    return { runner, calls, needs };
}
const flush = () => new Promise(r => setImmediate(r));
const phases = (calls, npc) => calls.emits.filter(e => e.name === `npc_workaround:${npc}`).map(e => e.data.phase);

const MEI_RUN = { index: 0, hand: 1, do: 'writes_down', dwell: 6 };
const TOM_RUN = { index: 0, hand: 3, do: 'prop_door', dwell: 4, door: 'store_room', prop: 'store_wedge' };
const ELLIS_RUN = { index: 0, hand: 1, do: 'emit', dwell: 0, event: 'ellis_gave_up' };
const visitDone = (npcId, run) => ({ npcId, kind: 'workaround', data: { workaround: { index: run.index, hand: run.hand, do: run.do } } });

test('writes_down: the start line, an at-post visit to her own PC, then done and the note mark', async () => {
    const { runner, calls } = stub({ answers: { mei: { pcId: 'mei_pc', hasPostit: true } } });
    assert.equal(runner.due({ npcId: 'mei', run: MEI_RUN, level: 60 }), true);
    assert.deepEqual(calls.mutters, [['mei', 'wk_writes_down']]);
    assert.equal(calls.visits.length, 1);
    const [id, v] = calls.visits[0];
    assert.equal(id, 'mei');
    assert.equal(v.kind, 'workaround');
    assert.deepEqual(v.at, { objectId: 'mei_pc' });
    assert.equal(v.useSeconds, 6);
    assert.deepEqual(phases(calls, 'mei'), ['started']);
    assert.equal(calls.sends.length, 0, 'nothing is sent before the visit is done');
    runner.visitDone(visitDone('mei', MEI_RUN));
    await flush();
    assert.deepEqual(calls.sends, [{ npc_id: 'mei', index: 0, hand: 1, dropped: false }]);
    assert.deepEqual(calls.postits, [['mei_pc', true]]);
    assert.deepEqual(phases(calls, 'mei'), ['started', 'done']);
});

test('prop_door: a visit to the prop, then the door opened, the global set and door_propped', async () => {
    const roomData = { npcs: [{ id: 'una' }] };
    const { runner, calls } = stub({ answers: { tom: { roomId: 'store_room', roomData, setGlobal: 'store_door_propped' } } });
    runner.due({ npcId: 'tom', run: TOM_RUN });
    assert.deepEqual(calls.mutters, [['tom', 'wk_prop_door']]);
    assert.deepEqual(calls.visits[0][1].at, { objectId: 'store_wedge' });
    assert.equal(calls.visits[0][1].useSeconds, 4);
    runner.visitDone(visitDone('tom', TOM_RUN));
    await flush();
    assert.deepEqual(calls.doors, [['store_room', roomData]]);
    assert.deepEqual(calls.globals, [['store_door_propped', true]]);
    const propped = calls.emits.find(e => e.name === 'door_propped:store_room');
    assert.deepEqual(propped.data, { roomId: 'store_room', npcId: 'tom' });
    assert.deepEqual(phases(calls, 'tom'), ['started', 'done']);
});

test('emit: no line and no visit; the event fires with the level, then it is confirmed', async () => {
    const { runner, calls } = stub();
    runner.due({ npcId: 'ellis', run: ELLIS_RUN, level: 20 });
    assert.deepEqual(calls.mutters, []);
    assert.deepEqual(calls.visits, []);
    const ev = calls.emits.find(e => e.name === 'ellis_gave_up');
    assert.deepEqual(ev.data, { npcId: 'ellis', level: 20 });
    assert.ok(calls.emits.indexOf(ev) < calls.emits.length, 'the event before the confirmation');
    await flush();
    assert.deepEqual(calls.sends, [{ npc_id: 'ellis', index: 0, hand: 1, dropped: false }]);
    assert.deepEqual(phases(calls, 'ellis'), ['started', 'done']);
});

test('a dropped visit is reported dropped, and a visit that cannot be queued too', async () => {
    const { runner, calls, needs } = stub();
    runner.due({ npcId: 'mei', run: MEI_RUN });
    runner.visitDropped({ npcId: 'mei', kind: 'workaround', data: { workaround: { index: 0, hand: 1 } }, reason: 'deadline' });
    await flush();
    assert.deepEqual(calls.sends, [{ npc_id: 'mei', index: 0, hand: 1, dropped: true }]);
    assert.deepEqual(calls.postits, []);
    assert.deepEqual(phases(calls, 'mei'), ['started', 'dropped']);
    needs.enqueueVisit = () => false;
    runner.due({ npcId: 'tom', run: TOM_RUN });
    await flush();
    assert.equal(calls.sends[1].dropped, true);
});

test('a check visit and another hand-over\'s visit are not this one', async () => {
    const { runner, calls } = stub();
    runner.due({ npcId: 'mei', run: MEI_RUN });
    runner.visitDone({ npcId: 'mei', kind: 'check', data: { resourceId: 'rota' } });
    runner.visitDone(visitDone('mei', { ...MEI_RUN, hand: 2 }));
    await flush();
    assert.equal(calls.sends.length, 0);
});

test('a failed "done" is resent and its answer applied once', async () => {
    const { runner, calls } = stub({ answers: { mei: { pcId: 'mei_pc', hasPostit: true } }, failures: [{ status: 502 }] });
    runner.due({ npcId: 'mei', run: MEI_RUN });
    runner.visitDone(visitDone('mei', MEI_RUN));
    await flush();
    assert.equal(calls.timers.length, 1);
    assert.equal(calls.postits.length, 0);
    calls.timers[0].fn();
    await flush();
    assert.equal(calls.sends.length, 2);
    assert.deepEqual(calls.postits, [['mei_pc', true]]);
    runner.visitDone(visitDone('mei', MEI_RUN));
    runner.due({ npcId: 'mei', run: MEI_RUN });
    await flush();
    assert.equal(calls.sends.length, 2, 'a spent hand-over is not started or sent again');
    assert.equal(calls.postits.length, 1);
});

test('a 425 is retried after the dwell; a 403 ends the hand-over', async () => {
    const { runner, calls } = stub({ answers: { tom: { roomId: 'store_room' } }, failures: [{ status: 425, body: { retryAfter: 4 } }] });
    runner.due({ npcId: 'tom', run: TOM_RUN });
    runner.visitDone(visitDone('tom', TOM_RUN));
    await flush();
    assert.equal(calls.timers[0].ms, 4000);
    calls.timers[0].fn();
    await flush();
    assert.deepEqual(calls.doors.map(d => d[0]), ['store_room']);
    const b = stub({ failures: [{ status: 403 }] });
    b.runner.due({ npcId: 'mei', run: MEI_RUN });
    b.runner.visitDone(visitDone('mei', MEI_RUN));
    await flush();
    assert.equal(b.calls.timers.length, 0);
    assert.deepEqual(phases(b.calls, 'mei'), ['started', 'ended']);
});

test('a load sets every done setGlobal again', () => {
    const { runner, calls } = stub();
    runner.restore({ tom: { level: 60, done: [{ index: 0, do: 'prop_door', setGlobal: 'store_door_propped' }], pending: [] },
        mei: { level: 60, done: [{ index: 0, do: 'writes_down' }] } });
    assert.deepEqual(calls.globals, [['store_door_propped', true]]);
});

test('a kind this build does not perform is given back as dropped', async () => {
    const { runner, calls } = stub();
    runner.due({ npcId: 'mei', run: { index: 1, hand: 2, do: 'borrow_session', dwell: 0, pc: 'hot_desk' } });
    await flush();
    assert.deepEqual(calls.sends, [{ npc_id: 'mei', index: 1, hand: 2, dropped: true }]);
    assert.equal(START_POOLS.borrow_session, 'wk_borrow');
});

test('openProppedDoor: every loaded door sprite to the room is unlocked and opened, with the room data cached', () => {
    const opened = [];
    const cache = new Map();
    const sp = { doorProperties: { connectedRoom: 'store_room', locked: true } };
    const other = { doorProperties: { connectedRoom: 'lobby', locked: true } };
    const w = {
        rooms: { office: { doorSprites: [sp, other] }, store_room: { locked: true } },
        gameScenario: { rooms: { store_room: { locked: true } } },
        roomDataCache: cache,
        unlockDoor: (s, data) => opened.push([s, data])
    };
    openProppedDoor('store_room', { id: 'x' }, w);
    assert.equal(sp.doorProperties.locked, false);
    assert.equal(other.doorProperties.locked, true);
    assert.equal(w.gameScenario.rooms.store_room.locked, false);
    assert.equal(w.rooms.store_room.locked, false);
    assert.deepEqual(opened, [[sp, { id: 'x' }]]);
    assert.deepEqual(cache.get('store_room'), { id: 'x' });
});

// ── with the needs system ───────────────────────────────────────────────

function wired(opts = {}) {
    const t = workWorld(opts);
    const sends = [];
    const runner = new NpcWorkarounds({
        send: async body => { sends.push(body); return { pcId: 'dana_pc', hasPostit: true }; },
        needs: () => t.sys,
        emit: () => {},
        npcRecord: id => (id === 'dana' ? { needsHome: 'dana_pc' } : null),
        setTimer: () => {}
    });
    // Feed the needs system's own events to the runner, as installNpcWorkarounds does
    const orig = t.sys._emit.bind(t.sys);
    t.sys._emit = (name, data) => {
        orig(name, data);
        if (name.startsWith('npc_workaround_due:')) runner.due(data);
        else if (name.startsWith('npc_visit_done:')) runner.visitDone(data);
        else if (name.startsWith('npc_visit_dropped:')) runner.visitDropped(data);
    };
    return { ...t, runner, sends };
}

function stepUntil(sys, pred, maxMs = 120000) {
    for (let t = 0; t < maxMs; t += 250) { if (pred()) return true; sys.step(250); }
    return pred();
}

test('needs: an answer with run starts the workaround; the at-post visit stays at the desk and is done', async () => {
    const { sys, runner, sends, evs } = wired({ chatter: { wk_writes_down: ["I'll never remember this one."] } });
    sys.registerAll();
    sys.applyFrustration([{ npcId: 'dana', level: 60, previous: 40, tell: 2, settled: false,
        run: { index: 0, hand: 1, do: 'writes_down', dwell: 6 } }]);
    sys.step(250);
    assert.equal(evs('npc_workaround_due:dana').length, 1);
    assert.equal(sys.getState('dana').talking?.line, "I'll never remember this one.");
    // The start line is an event a scripted run can see, heard or not (orchestrator decision, 9.2 B)
    const said = evs('npc_mutter:dana');
    assert.equal(said.length, 1);
    assert.deepEqual(said[0].data, { npcId: 'dana', topic: 'wk_writes_down', line: "I'll never remember this one.", picture: null });
    assert.ok(stepUntil(sys, () => evs('npc_visit_done:dana').length > 0, 60000));
    assert.equal(evs('npc_left_post:dana').length, 0, 'an at-post job never leaves the desk');
    await flush();
    assert.deepEqual(sends, [{ npc_id: 'dana', index: 0, hand: 1, dropped: false }]);
    assert.equal(runner.active.size, 0);
});

test('needs: a pending hand-over from a load is started once, when its NPC registers', () => {
    const { sys, runner, evs } = wired({ objects: [...baseObjects(), { id: 'wedge', x: 140, y: 100 }] });
    const pending = { index: 0, hand: 4, do: 'prop_door', dwell: 4, door: 'store', prop: 'wedge' };
    sys.restoreFrustration({ dana: { level: 60, tell: 2, settled: false, pending: [pending], done: [] } });
    assert.equal(evs('npc_workaround_due:').length, 0, 'not before the NPC registers');
    sys.registerAll();
    assert.equal(evs('npc_workaround_due:dana').length, 1);
    assert.equal(evs('npc_workaround_due:dana')[0].data.restored, true);
    sys.step(250);
    sys.restoreFrustration({ dana: { level: 60, tell: 2, settled: false, pending: [pending], done: [] } });
    assert.equal(runner.active.size, 1, 'one run for the hand-over');
});

test('needs (review R2 n1): an answer to a fail clears only that need\'s failSent mark', () => {
    const { sys } = workWorld();
    sys.registerAll();
    const s = sys.states.get('dana');
    s.failSent = { work: true, social_media: true };
    sys.applyFrustration([{ npcId: 'dana', level: 0, previous: 10, tell: 0, forEvent: 'ease', forNeed: 'work' }]);
    sys.step(250);
    assert.deepEqual(s.failSent, { work: true, social_media: true }, 'an ease answer clears nothing');
    sys.applyFrustration([{ npcId: 'dana', level: 20, previous: 0, tell: 1, forEvent: 'fail', forNeed: 'work' }]);
    sys.step(250);
    assert.deepEqual(s.failSent, { social_media: true });
});

// ── a propped door after a reload (plan 11.1 X4; orchestrator decision, 9.2 B) ─────────────────

function doorWorld() {
    const opened = [];
    const sprite = (from, to) => ({ active: true, doorProperties: { roomId: from, connectedRoom: to, locked: true, open: false } });
    const lobbyToStore = sprite('store_lobby', 'store_room');
    const lobbyToHall = sprite('store_lobby', 'hall_d');
    const rooms = { store_lobby: { doorSprites: [lobbyToStore, lobbyToHall] } };
    const runner = new NpcWorkarounds({
        setGlobal: () => {},
        loadedRooms: () => Object.keys(rooms),
        doorSprites: id => rooms[id]?.doorSprites || [],
        openSprite: sp => { opened.push(sp); sp.doorProperties.open = true; }
    });
    return { runner, rooms, opened, lobbyToStore, lobbyToHall, sprite };
}
const DONE_BLOCK = { tom: { level: 80, done: [{ index: 0, do: 'prop_door', setGlobal: 'store_door_propped', door: 'store_room' }] } };

test('a load opens the doors to a propped room in the rooms already built, and only those', () => {
    const { runner, opened, lobbyToStore, lobbyToHall } = doorWorld();
    runner.restore(DONE_BLOCK);
    assert.deepEqual(opened, [lobbyToStore]);
    assert.equal(lobbyToStore.doorProperties.locked, false);
    assert.equal(lobbyToHall.doorProperties.locked, true);
    assert.equal(runner.syncRoom('store_lobby'), 0, 'an open door is not opened twice');
});

test('a room built after the load opens its door to a propped room as it is built', () => {
    const { runner, rooms, opened, sprite } = doorWorld();
    delete rooms.store_lobby;
    runner.restore(DONE_BLOCK);
    assert.equal(opened.length, 0);
    const later = sprite('store_lobby', 'store_room');
    rooms.store_lobby = { doorSprites: [later] };
    assert.equal(runner.syncRoom('store_lobby'), 1);
    assert.deepEqual(opened, [later]);
});

test('no propped room: a load and a room build open nothing; a done entry of another kind names no door', () => {
    const { runner, opened } = doorWorld();
    runner.restore({ mei: { done: [{ index: 0, do: 'writes_down' }] }, ellis: { done: [{ index: 0, do: 'emit', door: 'store_room' }] } });
    assert.equal(runner.syncRoom('store_lobby'), 0);
    assert.equal(opened.length, 0);
});

test('a door propped in this session is remembered, so a room built later opens its side too', async () => {
    const { runner, rooms, opened, sprite } = doorWorld();
    delete rooms.store_lobby;
    runner.deps.send = async () => ({ roomId: 'store_room', roomData: null, setGlobal: 'store_door_propped' });
    runner.deps.needs = () => ({ mutter: () => true, enqueueVisit: () => true });
    runner.deps.emit = () => {};
    runner.deps.openDoor = () => {};
    runner.due({ npcId: 'tom', run: TOM_RUN });
    runner.visitDone(visitDone('tom', TOM_RUN));
    await flush();
    const later = sprite('store_lobby', 'store_room');
    rooms.store_lobby = { doorSprites: [later] };
    assert.equal(runner.syncRoom('store_lobby'), 1);
    assert.deepEqual(opened, [later]);
});

test('installNpcWorkarounds: the live deps open a propped door sprite through window.unlockDoor', () => {
    const prev = globalThis.window;
    const unlocked = [];
    const sp = { active: true, doorProperties: { roomId: 'store_lobby', connectedRoom: 'store_room', locked: true } };
    globalThis.window = {
        rooms: { store_lobby: { doorSprites: [sp] } },
        gameScenario: { rooms: { store_room: { locked: true } } },
        gameState: { globalVariables: {} },
        unlockDoor: (s, data) => unlocked.push([s, data])
    };
    try {
        const runner = installNpcWorkarounds({});
        runner.restore(DONE_BLOCK);
        assert.deepEqual(unlocked, [[sp, null]]);
        assert.equal(sp.doorProperties.locked, false);
        assert.equal(globalThis.window.gameScenario.rooms.store_room.locked, false);
        assert.equal(globalThis.window.gameState.globalVariables.store_door_propped, true);
    } finally {
        globalThis.window = prev;
    }
});

test('needs: a start line that comes while the fail line holds the speech lock is said after it, in words', () => {
    const { sys, evs } = wired({ chatter: { work_fail: ['Why is nothing working?'], wk_writes_down: ["I'll never remember this one."] } });
    sys.registerAll();
    sys.step(250);
    assert.equal(sys.mutter('dana', 'work_fail'), true);
    assert.equal(sys.mutter('dana', 'wk_writes_down'), true, 'queued, not dropped');
    assert.deepEqual(evs('npc_mutter:dana').map(e => e.data.topic), ['work_fail']);
    assert.ok(stepUntil(sys, () => evs('npc_mutter:dana').length === 2, 20000));
    const second = evs('npc_mutter:dana')[1].data;
    assert.equal(second.topic, 'wk_writes_down');
    assert.equal(second.line, "I'll never remember this one.");
    assert.equal(second.picture, null);
});

// ── review round 1 (9.2 B) ──────────────────────────────────────────────────────────────────────

test('R1 M1: a hand-over is never given up: eight failures, a backoff capped at 30 s, then the answer applied', async () => {
    const failures = Array.from({ length: 8 }, () => ({ status: 502 }));
    const { runner, calls } = stub({ answers: { mei: { pcId: 'mei_pc', hasPostit: true } }, failures });
    runner.due({ npcId: 'mei', run: MEI_RUN });
    runner.visitDone(visitDone('mei', MEI_RUN));
    await flush();
    for (let i = 0; i < 8; i++) { calls.timers[i].fn(); await flush(); }
    assert.deepEqual(calls.timers.map(t => t.ms), [2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000]);
    assert.equal(calls.sends.length, 9);
    assert.deepEqual(calls.postits, [['mei_pc', true]]);
    assert.deepEqual(phases(calls, 'mei'), ['started', 'done']);
    assert.equal(retryDelay(100), RETRY_MAX_MS);
});

test('R1 M1: a resent drop keeps resending too, and a 425 waits only the time left', async () => {
    const { runner, calls } = stub({ failures: [{ status: 0 }, { status: 503 }, { status: 425, body: { retryAfter: 2.5 } }] });
    runner.due({ npcId: 'tom', run: TOM_RUN });
    runner.visitDropped({ npcId: 'tom', kind: 'workaround', data: { workaround: { index: 0, hand: 3 } } });
    await flush();
    calls.timers[0].fn(); await flush();
    calls.timers[1].fn(); await flush();
    assert.deepEqual(calls.timers.map(t => t.ms), [2000, 4000, 2500]);
    calls.timers[2].fn(); await flush();
    assert.ok(calls.sends.every(b => b.dropped === true));
    assert.deepEqual(phases(calls, 'tom'), ['started', 'dropped']);
});

test('R1 m4 (server): a "done" answered { dropped: true } is applied as a drop, with nothing opened or set', async () => {
    const { runner, calls } = stub({ answers: { tom: { dropped: true } } });
    runner.due({ npcId: 'tom', run: TOM_RUN });
    runner.visitDone(visitDone('tom', TOM_RUN));
    await flush();
    assert.deepEqual(calls.doors, []);
    assert.deepEqual(calls.globals, []);
    assert.deepEqual(phases(calls, 'tom'), ['started', 'dropped']);
    assert.equal(calls.emits.filter(e => e.name.startsWith('door_propped')).length, 0);
});

test('R1 m5: a visit that cannot be queued says no start line and fires no started', async () => {
    const { runner, calls, needs } = stub();
    needs.enqueueVisit = () => false;
    runner.due({ npcId: 'tom', run: TOM_RUN });
    await flush();
    assert.deepEqual(calls.mutters, []);
    assert.deepEqual(phases(calls, 'tom'), ['dropped']);
    assert.equal(calls.sends[0].dropped, true);
    const b = stub();
    b.runner.due({ npcId: 'mei', run: { index: 1, hand: 2, do: 'borrow_session', dwell: 0, pc: 'hot_desk' } });
    await flush();
    assert.deepEqual(b.calls.mutters, [], 'a kind this build does not perform says nothing');
    const c = stub();
    c.runner.due({ npcId: 'mei', run: MEI_RUN });
    assert.deepEqual(c.calls.mutters, [['mei', 'wk_writes_down']], 'a queued visit says its line');
});

test('R1 m6: installNpcWorkarounds twice gives the same runner and one set of listeners', () => {
    const prev = globalThis.window;
    const added = [];
    globalThis.window = { eventDispatcher: { on: (name, fn) => added.push(name), emit: () => {} } };
    try {
        const a = installNpcWorkarounds({});
        const b = installNpcWorkarounds({});
        assert.equal(a, b);
        assert.deepEqual(added, ['npc_workaround_due:*', 'npc_visit_done:*', 'npc_visit_dropped:*']);
    } finally {
        globalThis.window = prev;
    }
});

test('R1 m6: a load with two pending hand-overs for one NPC starts both, once each', () => {
    const { sys, runner, evs } = wired({ objects: [...baseObjects(), { id: 'wedge', x: 140, y: 100 }] });
    const a = { index: 0, hand: 4, do: 'prop_door', dwell: 4, door: 'store', prop: 'wedge' };
    const b = { index: 1, hand: 5, do: 'emit', dwell: 0, event: 'dana_gave_up' };
    sys.restoreFrustration({ dana: { level: 80, tell: 2, settled: false, pending: [a, b], done: [] } });
    sys.registerAll();
    assert.equal(evs('npc_workaround_due:dana').length, 2);
    assert.ok(runner.active.has('dana:0:4'));
    assert.ok(runner.active.has('dana:1:5') || runner.finished.has('dana:1:5'));
});

test('R1 m4: reset() reports a workaround visit dropped, so the runner frees the hand-over', async () => {
    const { sys, runner, sends } = wired({ objects: [...baseObjects(), { id: 'wedge', x: 140, y: 100 }] });
    sys.registerAll();
    runner.due({ npcId: 'dana', run: { index: 0, hand: 4, do: 'prop_door', dwell: 4, door: 'store', prop: 'wedge' } });
    sys.step(250);
    assert.equal(runner.active.get('dana:0:4').state, 'running');
    sys.reset();
    await flush();
    assert.deepEqual(sends, [{ npc_id: 'dana', index: 0, hand: 4, dropped: true }]);
    assert.equal(runner.active.size, 0);
});

function twoWorld(chatter) {
    return wired({
        npcs: { dana: { pos: { x: 100, y: 100 }, rec: dana() }, mei: { pos: { x: 160, y: 100 }, rec: dana({ id: 'mei', needsHome: 'mei_pc' }) } },
        objects: [...baseObjects(), { id: 'mei_pc', x: 160, y: 68, desk: true, affordance: { satisfies: 'work', restores: 60, useSeconds: 5 } }],
        chatter
    });
}
const LINES = { work_fail: ['Why is nothing working?'], wk_writes_down: ["I'll never remember this one."], wk_prop_door: ["I'm not badging in every time."] };

test('R1 m1: two start lines for one NPC while the lock is held are both said, in words, in order', () => {
    const { sys, evs } = wired({ chatter: LINES });
    sys.registerAll();
    sys.step(250);
    sys.mutter('dana', 'work_fail');
    sys.mutter('dana', 'wk_writes_down');
    sys.mutter('dana', 'wk_prop_door');
    assert.equal(sys.mutterWaits().length, 2);
    assert.ok(stepUntil(sys, () => evs('npc_mutter:dana').length === 3, 30000));
    const said = evs('npc_mutter:dana').map(e => e.data);
    assert.deepEqual(said.map(d => d.topic), ['work_fail', 'wk_writes_down', 'wk_prop_door']);
    assert.ok(said.every(d => d.line && d.picture === null), 'each in words');
});

test('R1 m2: several NPCs freed on the same tick each say their start line in words', () => {
    const { sys, evs } = twoWorld(LINES);
    sys.registerAll();
    sys.step(250);
    sys.mutter('dana', 'work_fail');
    sys.mutter('mei', 'wk_writes_down');
    sys.mutter('dana', 'wk_prop_door');
    assert.ok(stepUntil(sys, () => evs('npc_mutter:').length === 3, 30000));
    const said = evs('npc_mutter:').map(e => e.data);
    assert.deepEqual(said.map(d => [d.npcId, d.topic]), [['dana', 'work_fail'], ['mei', 'wk_writes_down'], ['dana', 'wk_prop_door']]);
    assert.ok(said.every(d => d.line && d.picture === null), 'none turned into a picture');
});

test('R1 m6: a start line whose lock stays taken for MUTTER_WAIT_MS gets its picture; a start line stays up 6 s', () => {
    const { sys, evs } = wired({ chatter: LINES });
    sys.registerAll();
    sys.step(250);
    sys.mutter('dana', 'wk_writes_down');
    const said = evs('npc_mutter:dana')[0].data;
    assert.ok(said.line);
    const st = sys.states.get('dana');
    assert.ok(st.saying.until - sys.clockMs >= 6000 - 250, 'a start line bubble lasts at least MUTTER_BUBBLE_MS');
    sys._speechUntil = sys.clockMs + 60000;   // someone else holds the lock for a minute
    sys.mutter('dana', 'wk_prop_door');
    assert.ok(stepUntil(sys, () => evs('npc_mutter:dana').length === 2, 30000));
    const late = evs('npc_mutter:dana')[1].data;
    assert.equal(late.line, null);
    assert.ok(late.picture);
});

test('R1 m3: a start line waiting while its NPC is unavailable is held, then dropped, never said late', () => {
    const t = wired({ chatter: LINES });
    const { sys, evs, w } = t;
    sys.registerAll();
    sys.step(250);
    sys.mutter('dana', 'work_fail');
    let hidden = true;
    w.world.npcStatus = () => (hidden ? { hidden: true } : {});
    sys.mutter('dana', 'wk_writes_down');
    for (let i = 0; i < 100; i++) sys.step(250);   // 25 s: past MUTTER_WAIT_MS
    hidden = false;
    for (let i = 0; i < 40; i++) sys.step(250);
    assert.deepEqual(evs('npc_mutter:dana').map(e => e.data.topic), ['work_fail']);
    assert.equal(sys.mutterWaits().length, 0);
    assert.equal(t.log('mutter_dropped').length, 1);
});

test('R1 m6: a waiting start line does not hold up a conversation line queued behind the same lock', () => {
    const { sys } = wired({ chatter: LINES });
    sys.registerAll();
    sys.step(250);
    sys.mutter('dana', 'work_fail');
    sys.mutter('dana', 'wk_writes_down');
    const lockAfterFail = sys._speechUntil;
    // The wait takes no lock of its own: until the fail line ends, the lock is the fail line's
    assert.equal(sys._speechUntil, lockAfterFail);
    while (sys.clockMs < lockAfterFail) sys.step(250);
    assert.ok(sys._speechUntil > lockAfterFail, 'then the start line takes it, like any other line');
});
