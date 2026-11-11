// The frustration report queue (systems/npc-reports.js), access slice 9.2 A-6 (plan 5.4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NpcReports, REPORT_INTERVAL_MS, MAX_BATCH, watchedGlobal, installNpcReports } from '../../public/break_escape/js/systems/npc-reports.js';

function harness(answerFor = r => ({ npcId: r.npc_id, level: 20, tell: 1, settled: false })) {
    let now = 0;
    const timers = [];
    const sent = [];
    const syncs = [];
    const applied = [];
    const r = new NpcReports({
        now: () => now,
        setTimer: (fn, ms) => { timers.push({ fn, at: now + ms }); return timers.length; },
        send: async batch => { sent.push({ at: now, batch }); return { answers: batch.map(answerFor) }; },
        sync: async () => { syncs.push(now); },
        apply: a => applied.push(...a),
        watched: name => name === 'share_down'
    });
    const advance = async ms => {
        now += ms;
        for (;;) {
            const due = timers.filter(t => t.at <= now && !t.done);
            if (!due.length) break;
            for (const t of due) { t.done = true; await t.fn(); }
            await new Promise(res => setImmediate(res));
        }
    };
    return { r, sent, syncs, applied, advance, setNow: v => { now = v; } };
}

const fail = (npc = 'dana') => ({ event: 'fail', need: 'work', objectId: `${npc}_pc`, missing: [{ id: 'finance_share', why: 'down' }] });

test('reports are sent together, never more often than every two seconds and never more than 20', async () => {
    const h = harness();
    for (let i = 0; i < 25; i++) h.r.queue(`n${i}`, fail(`n${i}`));
    await h.advance(0);
    assert.equal(h.sent.length, 1);
    assert.equal(h.sent[0].batch.length, MAX_BATCH);
    assert.deepEqual(h.sent[0].batch[0], { npc_id: 'n0', event: 'fail', need: 'work', object_id: 'n0_pc', missing: [{ id: 'finance_share', why: 'down' }] });
    await h.advance(REPORT_INTERVAL_MS - 1);
    assert.equal(h.sent.length, 1);
    await h.advance(1);
    assert.equal(h.sent.length, 2);
    assert.equal(h.sent[1].batch.length, 5);
    assert.equal(h.r.requests, 2);
    assert.equal(h.applied.length, 25);
});

test('no fail is sent for a settled NPC until an ease has been', async () => {
    const h = harness(r => ({ npcId: r.npc_id, level: 100, tell: 2, settled: true }));
    h.r.queue('kai', fail('kai'));
    await h.advance(0);
    assert.equal(h.r.queue('kai', fail('kai')), false);
    assert.equal(h.r.queue('kai', { event: 'ease', need: 'work', objectId: 'kai_pc' }), true);
    assert.equal(h.r.queue('kai', fail('kai')), true);
});

test('a change of a plan global forces one state sync before the next batch', async () => {
    const h = harness();
    h.r.onGlobalChanged('unrelated');
    h.r.queue('dana', fail());
    await h.advance(0);
    assert.equal(h.syncs.length, 0);
    h.r.onGlobalChanged('share_down');
    h.r.queue('dana', fail());
    await h.advance(REPORT_INTERVAL_MS);
    assert.equal(h.syncs.length, 1);
    h.r.queue('dana', fail());
    await h.advance(REPORT_INTERVAL_MS);
    assert.equal(h.syncs.length, 1, 'once per change');
});

test('a stale answer triggers one state sync and one resend', async () => {
    let first = true;
    const h = harness(r => { const a = first ? { npcId: r.npc_id, stale: true } : { npcId: r.npc_id, level: 20, tell: 1 }; first = false; return a; });
    h.r.queue('dana', fail());
    await h.advance(0);
    await h.advance(REPORT_INTERVAL_MS);
    assert.equal(h.sent.length, 2);
    assert.equal(h.syncs.length, 1);
    assert.deepEqual(h.sent[1].batch, h.sent[0].batch);
    assert.equal(h.applied.length, 1, 'the stale answer is not applied');
});

test('an NPC GET /scenario calls settled sends no fail after a reload until an ease', async () => {
    const h = harness();
    h.r.restore({ omar: { level: 100, tell: 2, settled: true }, dana: { level: 34, tell: 1, settled: false } });
    assert.equal(h.r.queue('omar', fail('omar')), false);
    assert.equal(h.r.queue('dana', fail('dana')), true);
    assert.equal(h.r.queue('omar', { event: 'ease', need: 'work', objectId: 'omar_pc' }), true);
    assert.equal(h.r.queue('omar', fail('omar')), true);
    h.r.restore(null);
    h.r.restore('nonsense');
});

// ── review R1 m6 and m9 ──────────────────────────────────────────────

test('a settled answer to a fail sent before the last ease is ignored (R1 m6)', async () => {
    let release;
    const h = harness(r => ({ npcId: r.npc_id, level: 100, tell: 2, settled: r.event === 'fail' }));
    const send = h.r.deps.send;
    h.r.deps.send = batch => new Promise(res => { release = () => res(send(batch)); });
    h.r.queue('kai', fail('kai'));
    const inFlight = h.advance(0);
    await new Promise(res => setImmediate(res));
    h.r.queue('kai', { event: 'ease', need: 'work', objectId: 'kai_pc' });   // queued while the fail is out
    release();
    await inFlight;
    assert.equal(h.r.settled.has('kai'), false, 'the late settled answer does not undo the ease');
    assert.equal(h.r.queue('kai', fail('kai')), true);
    assert.ok(!h.sent.flatMap(x => x.batch).some(r => '_seq' in r), 'the sequence number never goes on the wire');
});

test('a rejecting send loses that batch and the queue keeps going', async () => {
    const h = harness();
    let calls = 0;
    const send = h.r.deps.send;
    h.r.deps.send = async batch => { calls++; if (calls === 1) throw new Error('500'); return send(batch); };
    h.r.queue('dana', fail());
    await h.advance(0);
    assert.equal(h.applied.length, 0);
    assert.equal(h.r.sending, false);
    h.r.queue('dana', fail());
    await h.advance(REPORT_INTERVAL_MS);
    assert.equal(calls, 2);
    assert.equal(h.applied.length, 1);
});

test('watchedGlobal: plan globals, a station offWhen as a string and as an object, an NPC with no work', () => {
    const objects = { dana_pc: { affordance: { offWhen: 'dana_pc_off' } }, kai_pc: { affordance: { offWhen: { kai_pc_unplugged: true } } },
                      amy_pc: { affordance: { offWhen: 'amy_pc_off' } } };
    const w = {
        npcManager: { npcs: new Map([
            ['dana', { needsHome: 'dana_pc', work: { needs: [{ id: 'share', downIf: 'share_down', routes: [['vpn_up']] }] } }],
            ['kai', { needsHome: 'kai_pc', work: { needs: [] } }],
            ['amy', { needsHome: 'amy_pc' }]
        ]) },
        npcNeedsSystem: { world: { getObject: id => objects[id] || null } }
    };
    assert.equal(watchedGlobal('share_down', w), true);
    assert.equal(watchedGlobal('vpn_up', w), true);
    assert.equal(watchedGlobal('dana_pc_off', w), true);
    assert.equal(watchedGlobal('kai_pc_unplugged', w), true);
    assert.equal(watchedGlobal('amy_pc_off', w), false, 'an NPC with no work plan is not watched');
    assert.equal(watchedGlobal('unrelated', w), false);
    assert.equal(watchedGlobal(null, w), false);
    assert.equal(watchedGlobal('share_down', {}), false);
});

test('installNpcReports: one listener, the wildcard name parsed, idempotent', () => {
    const listeners = [];
    const prev = globalThis.window;
    globalThis.window = {
        eventDispatcher: { on: (name, fn) => listeners.push({ name, fn }) },
        npcManager: { npcs: new Map([['dana', { needsHome: 'dana_pc', work: { needs: [{ id: 's', downIf: 'share_down' }] } }]]) },
        npcNeedsSystem: { world: { getObject: () => null } }
    };
    try {
        const api = { post: async () => ({ answers: [] }) };
        const a = installNpcReports(api);
        const b = installNpcReports(api);
        assert.equal(a, b);
        assert.equal(globalThis.window.npcReports, a);
        assert.equal(listeners.length, 1);
        assert.equal(listeners[0].name, 'global_variable_changed:*');
        listeners[0].fn({}, 'global_variable_changed:unrelated');
        assert.equal(a.needSync, false);
        listeners[0].fn({}, 'global_variable_changed:share_down');
        assert.equal(a.needSync, true);
        a.needSync = false;
        listeners[0].fn({ name: 'share_down' }, undefined);
        assert.equal(a.needSync, true, 'the name from the payload when the event name is not passed');
    } finally {
        globalThis.window = prev;
    }
});
