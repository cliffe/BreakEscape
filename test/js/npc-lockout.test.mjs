// Access slice 9.2 sub-slice L (ACCESS_MODEL_SLICE_9_2_PLAN.md 6.6, 12 L-1) in the browser: the
// report queue's `check` (sent only after a lockout answer at that PC, on a locked return under a
// maxAttempts policy), the needs core's flag and its held first use, the restore, and the
// workstation layer locking a flagged owner's screen on every leave.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NpcReports, shouldCheckLockout, installNpcReports } from '../../public/break_escape/js/systems/npc-reports.js';
import { LOCK_CHECK_WAIT_MS } from '../../public/break_escape/js/systems/npc-needs.js';
import { WorkstationState } from '../../public/break_escape/js/systems/workstation-state.js';
import { workWorld, baseObjects } from './fixtures/needs-work-world.mjs';

const STRICT = { autoLockMin: 5, maxAttempts: 3 };
const OWNER = { id: 'dana', needsHome: 'dana_pc', work: { needs: [{ id: 'email', kind: 'email', admitted: true }] } };
const CHATTER = { station_fail: ['This PC is useless.'], work_fail: ['Why is nothing working?'] };

function stepUntil(sys, pred, maxMs = 60000) {
    for (let t = 0; t < maxMs; t += 250) { if (pred()) return true; sys.step(250); }
    return pred();
}

// ── the report queue ───────────────────────────────────────────────────

function harness({ answerFor = r => ({ npcId: r.npc_id, lockedOut: true }), policy = STRICT, owner = OWNER, flagged = false, send } = {}) {
    let now = 0;
    const timers = [];
    const sent = [];
    const applied = [];
    const marks = [];
    const r = new NpcReports({
        now: () => now,
        setTimer: (fn, ms) => { timers.push({ fn, at: now + ms }); return timers.length; },
        send: send || (async batch => { sent.push(batch); return { answers: batch.map(answerFor) }; }),
        apply: a => applied.push(...a),
        policyFor: () => policy,
        ownerRecord: () => owner,
        flagged: () => flagged,
        markCheck: (id, pc) => { marks.push([id, pc]); return true; }
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
    return { r, sent, applied, marks, advance };
}
const RETURN = { objectId: 'dana_pc', ownerId: 'dana', wasLocked: true };

test('shouldCheckLockout: every condition must hold', () => {
    const ok = { wasLocked: true, seen: true, pcId: 'dana_pc', policy: STRICT, owner: OWNER, flagged: false };
    assert.equal(shouldCheckLockout(ok), true);
    assert.equal(shouldCheckLockout({ ...ok, wasLocked: false }), false, 'an owner whose screen stayed open never types a password');
    assert.equal(shouldCheckLockout({ ...ok, seen: false }), false, 'no lockout answer seen at that PC');
    assert.equal(shouldCheckLockout({ ...ok, flagged: true }), false, 'already flagged');
    assert.equal(shouldCheckLockout({ ...ok, policy: { autoLockMin: 5 } }), false, 'no maxAttempts');
    assert.equal(shouldCheckLockout({ ...ok, policy: { maxAttempts: 0 } }), false);
    assert.equal(shouldCheckLockout({ ...ok, policy: null }), false);
    assert.equal(shouldCheckLockout({ ...ok, owner: { ...OWNER, work: undefined } }), false, 'no work plan');
    assert.equal(shouldCheckLockout({ ...ok, owner: { ...OWNER, needsHome: 'other_pc' } }), false, 'not its station');
});

test('no check is sent for a PC where no lockout answer was seen, so a mission with no lockout sends none', async () => {
    const h = harness();
    assert.equal(h.r.onOwnerReturned(RETURN), false);
    h.r.noteLockout('other_pc');
    assert.equal(h.r.onOwnerReturned(RETURN), false);
    await h.advance(5000);
    assert.equal(h.sent.length, 0);
    assert.equal(h.r.requests, 0);
    assert.equal(h.marks.length, 0);
});

test('a locked return to a PC with a lockout seen sends one check and hands its answer over', async () => {
    const h = harness();
    h.r.noteLockout('dana_pc');
    assert.equal(h.r.onOwnerReturned({ ...RETURN, wasLocked: false }), false, 'an open screen: no check');
    assert.equal(h.r.onOwnerReturned(RETURN), true);
    assert.deepEqual(h.marks, [['dana', 'dana_pc']], 'the needs system holds the first use');
    await h.advance(0);
    assert.deepEqual(h.sent, [[{ npc_id: 'dana', event: 'check', object_id: 'dana_pc' }]]);
    assert.deepEqual(h.applied, [{ npcId: 'dana', forEvent: 'check', forObject: 'dana_pc', lockedOut: true }]);
    assert.equal(h.r.checks, 1);
});

test('a check is sent for a settled NPC too, and is not batched as a fail', async () => {
    const h = harness();
    h.r.settled.add('dana');
    h.r.noteLockout('dana_pc');
    assert.equal(h.r.onOwnerReturned(RETURN), true);
    await h.advance(0);
    assert.equal(h.sent[0][0].event, 'check');
    assert.equal(h.sent[0][0].missing, undefined);
});

test('a refused, malformed or mismatched check answer is lockedOut false for the needs system', async () => {
    for (const answer of [{ npcId: 'dana', refused: true }, null, { npcId: 'dana', lockedOut: 'yes' }, { npcId: 'leo', lockedOut: true }]) {
        const h = harness({ answerFor: () => answer });
        h.r.noteLockout('dana_pc');
        h.r.onOwnerReturned(RETURN);
        await h.advance(0);
        assert.deepEqual(h.applied, [{ npcId: 'dana', forEvent: 'check', forObject: 'dana_pc', lockedOut: false }], JSON.stringify(answer));
    }
});

test('a check in a lost request is sent once more, then counts as no lockout', async () => {
    let calls = 0;
    const h = harness({ send: async () => { calls++; throw new Error('offline'); } });
    h.r.noteLockout('dana_pc');
    h.r.onOwnerReturned(RETURN);
    await h.advance(0);
    assert.equal(calls, 1);
    assert.equal(h.applied.length, 0, 'not answered yet: sent again');
    await h.advance(2000);
    assert.equal(calls, 2);
    assert.deepEqual(h.applied, [{ npcId: 'dana', forEvent: 'check', forObject: 'dana_pc', lockedOut: false }]);
    await h.advance(4000);
    assert.equal(calls, 2, 'no third try');
});

test('installNpcReports: a locked_out sign-in answer marks the PC, and a locked return then checks', async () => {
    const listeners = {};
    const prev = globalThis.window;
    const marks = [];
    const posts = [];
    globalThis.window = {
        eventDispatcher: { on: (name, fn) => { listeners[name] = fn; } },
        gameScenario: { defaultPolicy: 'strict', policies: { strict: STRICT }, rooms: { office: { objects: [{ id: 'dana_pc' }] } } },
        npcManager: { getNPC: id => (id === 'dana' ? OWNER : null) },
        npcNeedsSystem: { isLockedOut: () => false, lockCheckSent: (id, pc) => { marks.push([id, pc]); return true; }, applyFrustration: () => {} }
    };
    try {
        const reports = installNpcReports({ post: async (path, body) => { posts.push(body); return { answers: [{ npcId: 'dana', lockedOut: true }] }; } });
        listeners['workstation_owner_returned:*'](RETURN);
        assert.equal(marks.length, 0, 'nothing seen yet');
        listeners.pc_signin_failed({ pcId: 'dana_pc', reason: 'wrong', attemptsLeft: 2 });
        listeners['workstation_owner_returned:*'](RETURN);
        assert.equal(marks.length, 0, 'a wrong password is not a lockout answer');
        listeners.pc_signin_failed({ pcId: 'dana_pc', reason: 'locked_out', attemptsLeft: 0 });
        listeners['workstation_owner_returned:*'](RETURN);
        assert.deepEqual(marks, [['dana', 'dana_pc']]);
        await reports.flush();
        assert.deepEqual(posts, [{ reports: [{ npc_id: 'dana', event: 'check', object_id: 'dana_pc' }] }]);
    } finally {
        globalThis.window = prev;
    }
});

// ── the needs core ─────────────────────────────────────────────────────

function lockWorld(extra = {}) {
    return workWorld({ chatter: CHATTER, ...extra });
}
const checkAnswer = (lockedOut, pc = 'dana_pc') => [{ npcId: 'dana', forEvent: 'check', forObject: pc, lockedOut }];

test('a flagged owner\'s uses of its station fail with locked_out: mutter, park with no wake, one report', () => {
    const { sys, evs, reports, log } = lockWorld();
    sys.registerAll();
    assert.equal(sys.lockCheckSent('dana', 'dana_pc'), true);
    sys.applyFrustration(checkAnswer(true));
    sys.step(250);
    assert.equal(sys.isLockedOut('dana', 'dana_pc'), true);
    assert.deepEqual(evs('npc_locked_out:dana')[0].data, { npcId: 'dana', objectId: 'dana_pc' });
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:dana').length > 0, 30000));
    assert.deepEqual(evs('npc_use_failed:dana')[0].data, { npcId: 'dana', objectId: 'dana_pc', need: 'work', missing: [{ id: 'dana_pc', why: 'locked_out' }], station: true });
    assert.equal(evs('npc_used:dana_pc').length, 0);
    assert.equal(log('turned_back')[0].grumble, 'station_fail');
    assert.deepEqual(evs('npc_need_parked:dana')[0].data.wakeOn, []);
    assert.deepEqual(reports.filter(r => r.event === 'fail'), [{ npcId: 'dana', event: 'fail', need: 'work', objectId: 'dana_pc', missing: [{ id: 'dana_pc', why: 'locked_out' }] }]);
    const st = sys.getState('dana');
    assert.deepEqual(st.lockedOut, ['dana_pc']);
    assert.deepEqual(st.lockCheck, []);
});

test('the lockout comes first beside other causes, and only for work at the station', () => {
    const { sys, evs } = lockWorld({ globals: { share_down: true } });
    sys.registerAll();
    sys.lockCheckSent('dana', 'dana_pc');
    sys.applyFrustration(checkAnswer(true));
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:dana').length > 0, 30000));
    assert.deepEqual(evs('npc_use_failed:dana')[0].data.missing, [{ id: 'dana_pc', why: 'locked_out' }, { id: 'finance_share', why: 'down' }]);
});

test('the flag fails uses of that PC and not of another: a borrowed hot desk is met', () => {
    const HOT = { id: 'hot_desk', x: 400, y: 68, desk: true, affordance: { satisfies: 'work', restores: 60, useSeconds: 5 } };
    const { sys, evs } = lockWorld({ objects: [...baseObjects(), HOT] });
    sys.registerAll();
    sys.lockCheckSent('dana', 'dana_pc');
    sys.applyFrustration(checkAnswer(true));
    assert.ok(stepUntil(sys, () => evs('npc_need_parked:dana').length > 0, 30000));
    assert.equal(sys.setBorrow('dana', { index: 0, hand: 1, do: 'borrow_session', pc: 'hot_desk', need: 'work', dwell: 2 }), true);
    assert.ok(stepUntil(sys, () => evs('npc_borrow_done:dana').length > 0, 30000));
    assert.equal(evs('npc_borrow_done:dana')[0].data.met, true);
    assert.equal(evs('npc_used:hot_desk')[0].data.met, true);
    assert.equal(sys.isLockedOut('dana', 'hot_desk'), false);
});

test('the first use after a check waits at the desk for the answer: true fails it, false lets it be met', () => {
    for (const lockedOut of [true, false]) {
        const { sys, evs, log } = lockWorld();
        sys.registerAll();
        assert.ok(stepUntil(sys, () => sys.getState('dana').job?.phase === 'using', 30000));
        sys.lockCheckSent('dana', 'dana_pc');
        sys.step(10000);   // twice the use time
        assert.equal(sys.getState('dana').job?.phase, 'using', 'held at the desk');
        assert.equal(evs('npc_used:dana_pc').length + evs('npc_use_failed:dana').length, 0, 'no verdict yet');
        assert.equal(log('use_held').length, 1);
        sys.applyFrustration(checkAnswer(lockedOut));
        sys.step(500);
        if (lockedOut) {
            assert.equal(evs('npc_use_failed:dana').length, 1);
            assert.equal(evs('npc_used:dana_pc').length, 0);
        } else {
            assert.equal(evs('npc_used:dana_pc')[0].data.met, true);
            assert.equal(sys.isLockedOut('dana', 'dana_pc'), false);
        }
    }
});

test('a hold whose answer never comes lapses after LOCK_CHECK_WAIT_MS and the use is judged as before', () => {
    const { sys, evs, log } = lockWorld();
    sys.registerAll();
    assert.ok(stepUntil(sys, () => sys.getState('dana').job?.phase === 'using', 30000));
    sys.lockCheckSent('dana', 'dana_pc');
    sys.step(LOCK_CHECK_WAIT_MS - 1000);
    assert.equal(evs('npc_used:dana_pc').length, 0);
    sys.step(2000);
    assert.equal(log('lock_check_lapsed').length, 1);
    assert.equal(evs('npc_used:dana_pc')[0].data.met, true);
});

test('a check is taken only for the NPC\'s own station; an answer for another PC flags nothing', () => {
    const { sys } = lockWorld();
    sys.registerAll();
    assert.equal(sys.lockCheckSent('dana', 'hot_desk'), false);
    assert.equal(sys.lockCheckSent('nobody', 'dana_pc'), false);
    sys.applyFrustration(checkAnswer(true, 'hot_desk'));
    sys.step(250);
    assert.deepEqual(sys.getState('dana').lockedOut, []);
});

test('the flag is restored from npcFrustration when the room loads, kept through reset(), and only for the station', () => {
    const { sys, evs, log } = lockWorld();
    sys.restoreFrustration({ dana: { level: 40, tell: 2, settled: false, lockedOut: ['dana_pc', 'hot_desk'] } });
    sys.registerAll();
    assert.deepEqual(sys.getState('dana').lockedOut, ['dana_pc']);
    assert.equal(log('locked_out')[0].restored, true);
    assert.equal(evs('npc_locked_out:').length, 0, 'a restore emits nothing');
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:dana').length > 0, 30000), 'the first use after the load fails');
    assert.equal(evs('npc_use_failed:dana')[0].data.missing[0].why, 'locked_out');
    sys.reset();
    assert.deepEqual(sys.getState('dana').lockedOut, ['dana_pc']);
});

// ── the workstation layer ──────────────────────────────────────────────

test('a flagged owner\'s screen locks on every leave whatever its lockChance; another owner\'s is unchanged', () => {
    const a = { id: 'pc_a', workstation: true, lockChance: 0 };
    const b = { id: 'pc_b', workstation: true, lockChance: 0 };
    const flagged = new Set();
    const env = {
        objects: () => [a, b],
        npcs: () => [{ id: 'ann', needsHome: 'pc_a' }, { id: 'bob', needsHome: 'pc_b' }],
        on: () => {}, emit: () => {}, setGlobal: () => {},
        roll: () => 0.5,
        lockedOut: (owner, pc) => flagged.has(`${owner}|${pc}`)
    };
    const ws = new WorkstationState(env).install();
    ws.onLeft('ann');
    assert.equal(a.screenLocked, false, 'not flagged: lockChance 0 leaves it open');
    ws.onReturned('ann');
    flagged.add('ann|pc_a');
    for (let i = 0; i < 3; i++) {
        ws.onLeft('ann'); ws.onLeft('bob');
        assert.equal(a.screenLocked, true, `leave ${i + 1}: locked`);
        assert.equal(b.screenLocked, false);
        ws.onReturned('ann'); ws.onReturned('bob');
    }
    // an env without lockedOut keeps today's answer
    const c = { id: 'pc_a', workstation: true, lockChance: 0 };
    const ws2 = new WorkstationState({ ...env, objects: () => [c], lockedOut: undefined }).install();
    ws2.onLeft('ann');
    assert.equal(c.screenLocked, false);
});
