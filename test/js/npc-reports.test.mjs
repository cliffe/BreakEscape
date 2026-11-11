// The frustration report queue (systems/npc-reports.js), access slice 9.2 A-6 (plan 5.4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NpcReports, REPORT_INTERVAL_MS, MAX_BATCH } from '../../public/break_escape/js/systems/npc-reports.js';

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
