// Access slice 9.2 sub-slice L (ACCESS_MODEL_SLICE_9_2_PLAN.md 6.6, 12 L-1) in the browser: the
// report queue's `check` (sent only after a lockout answer at that PC, on a locked return under a
// maxAttempts policy), the needs core's flag and its held first use, the restore, and the
// workstation layer locking a flagged owner's screen on every leave.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NpcReports, shouldCheckLockout, installNpcReports, SEND_TIMEOUT_MS } from '../../public/break_escape/js/systems/npc-reports.js';
import { LOCK_CHECK_WAIT_MS, BORROW_CHECK_WAIT_MS } from '../../public/break_escape/js/systems/npc-needs.js';
import { WorkstationState } from '../../public/break_escape/js/systems/workstation-state.js';
import { workWorld, baseObjects, dana } from './fixtures/needs-work-world.mjs';

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

// ── user decision q36: a lockout at a borrowed hot desk ─────────────────

const HOT_DESK = { id: 'hot_desk', x: 400, y: 68, desk: true, affordance: { satisfies: 'work', restores: 60, useSeconds: 5 } };
const BORROW = { index: 0, hand: 1, do: 'borrow_session', pc: 'hot_desk', need: 'work', dwell: 2 };

/** Dana, locked out at her own PC, borrows the hot desk; returns once she sits down there. */
function borrowing() {
    const out = lockWorld({ objects: [...baseObjects(), HOT_DESK] });
    const { sys, evs } = out;
    sys.registerAll();
    sys.lockCheckSent('dana', 'dana_pc');
    sys.applyFrustration(checkAnswer(true));
    assert.ok(stepUntil(sys, () => evs('npc_need_parked:dana').length > 0, 30000));
    assert.equal(sys.setBorrow('dana', BORROW), true);
    assert.ok(stepUntil(sys, () => evs('npc_sat_at:hot_desk').length > 0, 30000));
    return out;
}

test('q36: lockCheckSent takes the PC of a borrow in use, and no other PC', () => {
    const { sys } = borrowing();
    assert.equal(sys.lockCheckSent('dana', 'pc_b'), false, 'not her station and not her borrow');
    assert.equal(sys.lockCheckSent('dana', 'hot_desk'), true);
});

test('q36: a check sent as the borrower sits holds the borrowed use; true fails it with locked_out, unreported', () => {
    const { sys, evs, reports, log } = borrowing();
    const failsBefore = reports.filter(r => r.event === 'fail').length;
    assert.equal(sys.lockCheckSent('dana', 'hot_desk'), true);
    sys.step(7000);   // past the use time, inside the hold's limit
    assert.equal(sys.getState('dana').job?.phase, 'using', 'held at the hot desk');
    assert.equal(evs('npc_borrow_done:dana').length, 0, 'no verdict yet');
    assert.ok(log('use_held').some(e => e.target === 'hot_desk'));
    sys.applyFrustration(checkAnswer(true, 'hot_desk'));
    sys.step(500);
    assert.equal(sys.isLockedOut('dana', 'hot_desk'), true);
    assert.deepEqual(evs('npc_locked_out:dana').at(-1).data, { npcId: 'dana', objectId: 'hot_desk' });
    assert.ok(stepUntil(sys, () => evs('npc_borrow_done:dana').length > 0, 5000));
    assert.equal(evs('npc_borrow_done:dana')[0].data.met, false, 'her sign-in there fails');
    assert.equal(evs('npc_used:hot_desk').length, 0, 'no met use, nothing restored');
    const failed = evs('npc_use_failed:dana').at(-1).data;
    assert.equal(failed.objectId, 'hot_desk');
    assert.deepEqual(failed.missing[0], { id: 'hot_desk', why: 'locked_out' });
    assert.equal(reports.filter(r => r.event === 'fail').length, failsBefore, 'a failed borrowed use is not reported (6.4)');
    assert.equal(reports.filter(r => r.event === 'ease').length, 0, 'and no ease is sent');
});

test('q36: a false answer at the hot desk lets the borrowed use be met', () => {
    const { sys, evs } = borrowing();
    sys.lockCheckSent('dana', 'hot_desk');
    sys.step(6000);
    sys.applyFrustration(checkAnswer(false, 'hot_desk'));
    assert.ok(stepUntil(sys, () => evs('npc_borrow_done:dana').length > 0, 5000));
    assert.equal(evs('npc_borrow_done:dana')[0].data.met, true);
    assert.equal(evs('npc_used:hot_desk')[0].data.met, true);
    assert.equal(sys.isLockedOut('dana', 'hot_desk'), false);
});

test('R1 m1: a hold at the hot desk lasts BORROW_CHECK_WAIT_MS, then the use goes ahead as if not locked out', () => {
    const { sys, evs, log } = borrowing();
    sys.lockCheckSent('dana', 'hot_desk');
    sys.step(5000 + BORROW_CHECK_WAIT_MS - 1000);   // the use ends at 5 s and is held since
    assert.equal(sys.getState('dana').job?.phase, 'using', 'held inside the limit');
    assert.equal(evs('npc_borrow_done:dana').length, 0);
    assert.ok(stepUntil(sys, () => evs('npc_borrow_done:dana').length > 0, 3000), 'the hold ends with no answer');
    assert.equal(evs('npc_borrow_done:dana')[0].data.met, true);
    assert.equal(evs('npc_used:hot_desk')[0].data.met, true);
    assert.ok(log('lock_check_lapsed').some(e => e.target === 'hot_desk' && e.borrowed === true));
    // a late answer still counts, for the next use there
    sys.applyFrustration(checkAnswer(true, 'hot_desk'));
    sys.step(250);
    assert.equal(sys.isLockedOut('dana', 'hot_desk'), true);
});

test('R1 m1: a sync PUT that never settles stalls the check, and the borrowed use goes ahead after the limit', async () => {
    const out = lockWorld({ objects: [...baseObjects(), HOT_DESK] });
    const { sys, evs, w } = out;
    let now = 0;
    const timers = [];
    let sends = 0;
    let syncs = 0;
    const r = new NpcReports({
        now: () => now,
        setTimer: (fn, ms) => { timers.push({ fn, at: now + ms }); return timers.length; },
        send: async batch => { sends++; return { answers: batch.map(x => ({ npcId: x.npc_id, lockedOut: true })) }; },
        sync: () => { syncs++; return new Promise(() => {}); },   // the PUT /sync_state that never settles
        apply: a => sys.applyFrustration(a),
        policyFor: () => STRICT,
        flagged: (id, pc) => sys.isLockedOut(id, pc),
        markCheck: (id, pc) => sys.lockCheckSent(id, pc)
    });
    // the real event path: npc_sat_at reaches the queue's borrow listener
    const emit = w.world.emit;
    w.world.emit = (name, data) => { emit(name, data); if (name.startsWith('npc_sat_at:')) r.onBorrowSat(data); };
    const fire = async () => {
        for (const t of timers.filter(t => t.at <= now && !t.done)) { t.done = true; t.fn(); }
        await new Promise(res => setImmediate(res));
    };
    r.noteLockout('hot_desk');
    r.needSync = true;   // a watched global changed, so the next flush syncs first
    sys.registerAll();
    sys.lockCheckSent('dana', 'dana_pc');
    sys.applyFrustration(checkAnswer(true));
    assert.ok(stepUntil(sys, () => evs('npc_need_parked:dana').length > 0, 30000));
    assert.equal(sys.setBorrow('dana', BORROW), true);
    assert.ok(stepUntil(sys, () => evs('npc_sat_at:hot_desk').length > 0, 30000));
    assert.equal(r.checks, 1, 'the check went into the queue as she sat');
    for (let t = 0; t < 20000 && !evs('npc_borrow_done:dana').length; t += 250) {
        now += 250;
        await fire();
        sys.step(250);
    }
    assert.equal(syncs, 1, 'the flush is stuck in its sync');
    assert.equal(sends, 0, 'so the check is never sent or answered');
    assert.equal(evs('npc_borrow_done:dana').length, 1, 'the borrowed use did not hang');
    assert.equal(evs('npc_borrow_done:dana')[0].data.met, true, 'it went ahead as if not locked out');
    assert.equal(sys.isLockedOut('dana', 'hot_desk'), false);
});

test('q36: a true answer for a PC this owner never asked about is ignored', () => {
    const { sys } = lockWorld({ objects: [...baseObjects(), HOT_DESK] });
    sys.registerAll();
    sys.applyFrustration(checkAnswer(true, 'hot_desk'));
    sys.step(250);
    assert.equal(sys.isLockedOut('dana', 'hot_desk'), false);
});

test('q36: shouldCheckLockout\'s borrow path needs no locked return or owner, and keeps the other tests', () => {
    const ok = { borrowed: true, seen: true, pcId: 'hot_desk', policy: STRICT, flagged: false };
    assert.equal(shouldCheckLockout(ok), true);
    assert.equal(shouldCheckLockout({ ...ok, seen: false }), false, 'no lockout answer seen at that PC');
    assert.equal(shouldCheckLockout({ ...ok, flagged: true }), false);
    assert.equal(shouldCheckLockout({ ...ok, policy: { autoLockMin: 5 } }), false, 'no maxAttempts');
    assert.equal(shouldCheckLockout({ ...ok, borrowed: false }), false, 'not a borrow: a locked return is needed');
});

test('R1 m2: two borrowers at one hot desk: the first one\'s "no" does not clear the mark for the second', async () => {
    const { r, sent, advance } = harness({ answerFor: x => ({ npcId: x.npc_id, lockedOut: x.npc_id === 'ben' }) });
    r.noteLockout('hot_desk');   // the player locked out ben's username there
    assert.equal(r.onBorrowSat({ npcId: 'amy', objectId: 'hot_desk' }), true);
    await advance(2500);
    assert.equal(r.lockoutSeen.has('hot_desk'), true, 'amy\'s no clears nothing at the PC');
    assert.equal(r.borrowSeen('hot_desk', 'amy'), false, 'amy is not asked again');
    assert.equal(r.onBorrowSat({ npcId: 'amy', objectId: 'hot_desk' }), false);
    assert.equal(r.onBorrowSat({ npcId: 'ben', objectId: 'hot_desk' }), true, 'ben still checks');
    await advance(2500);
    assert.deepEqual(sent.flat().map(x => [x.npc_id, x.object_id]), [['amy', 'hot_desk'], ['ben', 'hot_desk']]);
    // a new lockout answer there asks amy again
    r.noteLockout('hot_desk');
    assert.equal(r.borrowSeen('hot_desk', 'amy'), true);
});

test('q36: onBorrowSat queues a check at the hot desk once a lockout answer was seen there', async () => {
    const { r, sent, marks, advance } = harness();
    assert.equal(r.onBorrowSat({ npcId: 'dana', objectId: 'hot_desk' }), false, 'no lockout seen there');
    r.noteLockout('hot_desk');
    assert.equal(r.onBorrowSat({ npcId: 'dana', objectId: 'hot_desk' }), true);
    assert.deepEqual(marks, [['dana', 'hot_desk']]);
    await advance(2500);
    assert.deepEqual(sent.flat().map(x => [x.npc_id, x.event, x.object_id]), [['dana', 'check', 'hot_desk']]);
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

test('a hold whose answer never comes lapses after LOCK_CHECK_WAIT_MS: the use is skipped, never met, and the next one waits again (R1 n1)', () => {
    const { sys, evs, log } = lockWorld();
    sys.registerAll();
    assert.ok(stepUntil(sys, () => sys.getState('dana').job?.phase === 'using', 30000));
    sys.lockCheckSent('dana', 'dana_pc');
    sys.step(LOCK_CHECK_WAIT_MS - 1000);
    assert.equal(evs('npc_used:dana_pc').length, 0);
    sys.step(2000);
    assert.equal(log('lock_check_lapsed').length, 1);
    assert.equal(evs('npc_used:dana_pc').length, 0, 'a lapse is not judged: no use goes through as met');
    assert.equal(evs('npc_use_failed:dana').length, 0, 'nor as failed');
    assert.deepEqual(sys.getState('dana').lockCheck, ['dana_pc'], 'the check is still in flight');
    // the next use waits for the answer as well, and lapses again with no verdict
    assert.ok(stepUntil(sys, () => log('lock_check_lapsed').length === 2, 120000), 'retried and lapsed again');
    assert.equal(evs('npc_used:dana_pc').length, 0);
    // the answer ends the wait
    sys.applyFrustration(checkAnswer(false));
    assert.ok(stepUntil(sys, () => evs('npc_used:dana_pc').length > 0, 60000));
    assert.equal(evs('npc_used:dana_pc')[0].data.met, true);
    assert.equal(log('lock_check_lapsed').length, 2);
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

test('the flag is restored from npcFrustration when the room loads and kept through reset(); q36: a borrowed hot desk too', () => {
    const { sys, evs, log } = lockWorld();
    // the server sends the station and the handed-over hot desks a check found it locked out at
    sys.restoreFrustration({ dana: { level: 40, tell: 2, settled: false, lockedOut: ['dana_pc', 'hot_desk'] } });
    sys.registerAll();
    assert.deepEqual(sys.getState('dana').lockedOut, ['dana_pc', 'hot_desk']);
    assert.equal(log('locked_out')[0].restored, true);
    assert.equal(evs('npc_locked_out:').length, 0, 'a restore emits nothing');
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:dana').length > 0, 30000), 'the first use after the load fails');
    assert.equal(evs('npc_use_failed:dana')[0].data.missing[0].why, 'locked_out');
    sys.reset();
    assert.deepEqual(sys.getState('dana').lockedOut, ['dana_pc', 'hot_desk']);
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

// ── review round 1 ─────────────────────────────────────────────────────

test('R1 m1: a false answer clears the mark, so the next locked return sends no check; a new lockout answer marks it again', async () => {
    const h = harness({ answerFor: r => ({ npcId: r.npc_id, lockedOut: false }) });
    h.r.noteLockout('dana_pc');
    assert.equal(h.r.onOwnerReturned(RETURN), true);
    await h.advance(0);
    assert.equal(h.r.lockoutSeen.has('dana_pc'), false, 'the server said no');
    assert.equal(h.r.onOwnerReturned(RETURN), false, 'no second check');
    h.r.noteLockout('dana_pc');
    assert.equal(h.r.onOwnerReturned(RETURN), true, 'a new lockout answer at that PC');
    assert.deepEqual(h.sent.flat().map(r => r.event), ['check'], 'the second check is queued, not yet sent');
    for (const batch of h.sent) for (const r of batch) assert.equal(r._mark, undefined, 'the mark is never sent');
});

test('R1 m1: a refused or lost answer keeps the mark, and so does a lockout noted while the check was in flight', async () => {
    const refused = harness({ answerFor: r => ({ npcId: r.npc_id, refused: true }) });
    refused.r.noteLockout('dana_pc');
    refused.r.onOwnerReturned(RETURN);
    await refused.advance(0);
    assert.equal(refused.r.lockoutSeen.has('dana_pc'), true);

    const lost = harness({ send: async () => { throw new Error('offline'); } });
    lost.r.noteLockout('dana_pc');
    lost.r.onOwnerReturned(RETURN);
    await lost.advance(0);
    await lost.advance(2000);
    assert.equal(lost.applied.length, 1, 'answered as no for the needs system');
    assert.equal(lost.r.lockoutSeen.has('dana_pc'), true, 'the server never said no');

    let release;
    const late = harness({ send: batch => new Promise(res => { release = () => res({ answers: batch.map(r => ({ npcId: r.npc_id, lockedOut: false })) }); }) });
    late.r.noteLockout('dana_pc');
    late.r.onOwnerReturned(RETURN);
    const flushing = late.advance(0);
    await new Promise(res => setImmediate(res));
    late.r.noteLockout('dana_pc');   // another lockout answer before the server's no arrives
    release();
    await flushing;
    assert.equal(late.r.lockoutSeen.has('dana_pc'), true);
});

test('R1 m1: markCheck refusing the hold queues nothing', async () => {
    const h = harness();
    h.r.deps.markCheck = () => false;
    h.r.noteLockout('dana_pc');
    assert.equal(h.r.onOwnerReturned(RETURN), false);
    await h.advance(5000);
    assert.equal(h.sent.length, 0);
    assert.equal(h.r.checks, 0);
});

test('R1 M1: installNpcReports seeds the mark from GET /scenario lockoutPcs, so a locked return after a reload checks', async () => {
    const listeners = {};
    const prev = globalThis.window;
    const marks = [];
    globalThis.window = {
        eventDispatcher: { on: (name, fn) => { listeners[name] = fn; } },
        gameScenario: { defaultPolicy: 'strict', policies: { strict: STRICT }, rooms: { office: { objects: [{ id: 'dana_pc' }] } }, lockoutPcs: ['dana_pc', 7, ''] },
        npcManager: { getNPC: id => (id === 'dana' ? OWNER : null) },
        npcNeedsSystem: { isLockedOut: () => false, lockCheckSent: (id, pc) => { marks.push([id, pc]); return true; }, applyFrustration: () => {} }
    };
    try {
        const reports = installNpcReports({ post: async () => ({ answers: [{ npcId: 'dana', lockedOut: true }] }) });
        assert.deepEqual([...reports.lockoutSeen], ['dana_pc'], 'ids only; anything else is ignored');
        listeners['workstation_owner_returned:*'](RETURN);
        assert.deepEqual(marks, [['dana', 'dana_pc']]);
    } finally {
        globalThis.window = prev;
    }
});

test('R1 n1: a true answer that comes after a lapse still flags the owner', () => {
    const { sys, evs } = lockWorld();
    sys.registerAll();
    assert.ok(stepUntil(sys, () => sys.getState('dana').job?.phase === 'using', 30000));
    sys.lockCheckSent('dana', 'dana_pc');
    sys.step(LOCK_CHECK_WAIT_MS + 1000);
    sys.applyFrustration(checkAnswer(true));
    sys.step(250);
    assert.equal(sys.isLockedOut('dana', 'dana_pc'), true);
    assert.deepEqual(sys.getState('dana').lockCheck, []);
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:dana').length > 0, 60000));
    assert.equal(evs('npc_used:dana_pc').length, 0, 'no use was met at any point');
});

test('R1 m2: the three layers on one dispatcher, in the live order: leave, locked return, check, held use, then the failure', async () => {
    const rec = dana({ needs: { work: { decayPerMin: 40, urgentAt: 50, initial: 60, jitterPct: 0 },
                                caffeine: { decayPerMin: 40, urgentAt: 10, initial: 12, jitterPct: 0 } } });
    const world = workWorld({ npcs: { dana: { pos: { x: 100, y: 100 }, rec } }, chatter: CHATTER });
    const { w, sys, evs, log } = world;
    // one dispatcher: every emit reaches the listeners at once, as eventDispatcher does
    const listeners = [];
    const on = (pattern, fn) => listeners.push({ pattern, fn });
    const order = [];
    const emit = w.world.emit;
    w.world.emit = (name, data) => {
        emit(name, data);
        if (/^(npc_left_post|npc_returned_post|workstation_owner_returned|npc_used|npc_use_failed):/.test(name)) order.push(name);
        for (const l of listeners) {
            const hit = l.pattern.endsWith(':*') ? name.startsWith(l.pattern.slice(0, -1)) : name === l.pattern;
            if (hit) l.fn(data, name);
        }
    };
    const pc = { id: 'dana_pc', workstation: true, lockChance: 1, policy: 'strict' };
    const ws = new WorkstationState({
        objects: () => [pc], npcs: () => [rec], on, emit: (n, d) => w.world.emit(n, d), setGlobal: () => {},
        roll: () => 0.5, clockMs: () => sys.clockMs, lockedOut: (o, p) => sys.isLockedOut(o, p)
    }).install();
    assert.ok(ws);
    let release = null;
    const sent = [];
    const reports = new NpcReports({
        now: () => sys.clockMs,
        // the answer comes in time: the send timeout (review R2 m2) never fires here
        setTimer: (fn, ms) => { if (ms < SEND_TIMEOUT_MS) Promise.resolve().then(fn); return 1; },
        send: batch => new Promise(res => { sent.push(batch); release = () => res({ answers: batch.map(r => ({ npcId: r.npc_id, lockedOut: true })) }); }),
        apply: a => sys.applyFrustration(a),
        policyFor: () => STRICT,
        ownerRecord: id => (id === 'dana' ? rec : null),
        flagged: (id, p) => sys.isLockedOut(id, p),
        markCheck: (id, p) => sys.lockCheckSent(id, p)
    });
    on('workstation_owner_returned:*', d => reports.onOwnerReturned(d));
    sys.registerAll();
    reports.noteLockout('dana_pc');   // the player's third wrong password while she is away
    assert.ok(stepUntil(sys, () => order.includes('workstation_owner_returned:dana_pc'), 120000), 'she leaves and comes back');
    assert.equal(pc.screenLocked, false, 'opened on her return');
    assert.ok(order.indexOf('npc_left_post:dana') < order.indexOf('workstation_owner_returned:dana_pc'));
    assert.equal(reports.checks, 1, 'the locked return sent one check');
    assert.deepEqual(sys.getState('dana').lockCheck, ['dana_pc'], 'the hold was taken in the same task as the return');
    const usedBefore = evs('npc_used:dana_pc').length;
    assert.ok(stepUntil(sys, () => log('use_held').length > 0, 60000), 'her first use there waits');
    assert.equal(evs('npc_used:dana_pc').length, usedBefore, 'no use met while the check is in flight');
    await new Promise(res => setImmediate(res));
    assert.equal(sent.length, 1);
    release();
    await new Promise(res => setImmediate(res));
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:dana').length > 0, 30000));
    assert.equal(evs('npc_use_failed:dana')[0].data.missing[0].why, 'locked_out');
    assert.equal(evs('npc_used:dana_pc').length, usedBefore, 'the held use was never met');
});

test('R2 m2: a send that never settles times out as a lost request, so the check is answered within two timeouts and the queue moves on', async () => {
    let now = 0;
    const timers = [];
    const signals = [];
    const sent = [];
    const applied = [];
    let hang = true;
    const r = new NpcReports({
        now: () => now,
        // fire and forget, as setTimeout does: a hung flush must not block the clock
        setTimer: (fn, ms) => { timers.push({ fn, at: now + ms }); return timers.length; },
        clearTimer: h => { if (timers[h - 1]) timers[h - 1].done = true; },
        send: (batch, opts) => {
            sent.push(batch);
            signals.push(opts?.signal);
            return hang ? new Promise(() => {}) : Promise.resolve({ answers: batch.map(b => ({ npcId: b.npc_id, level: 20, tell: 1 })) });
        },
        apply: a => applied.push(...a),
        policyFor: () => STRICT,
        ownerRecord: () => OWNER,
        flagged: () => false,
        markCheck: () => true
    });
    const settle = async () => { for (let i = 0; i < 5; i++) await new Promise(res => setImmediate(res)); };
    const advance = async ms => {
        const end = now + ms;
        for (;;) {
            const next = timers.filter(t => !t.done).sort((a, b) => a.at - b.at)[0];
            if (!next || next.at > end) break;
            now = Math.max(now, next.at);
            next.done = true;
            next.fn();
            await settle();
        }
        now = end;
        await settle();
    };
    r.noteLockout('dana_pc');
    r.onOwnerReturned(RETURN);
    await advance(0);
    assert.equal(sent.length, 1);
    assert.equal(applied.length, 0, 'the request is still out');
    await advance(SEND_TIMEOUT_MS);
    assert.equal(signals[0]?.aborted, true, 'the timed-out request is aborted');
    assert.equal(sent.length, 2, 'a lost check is sent once more');
    await advance(SEND_TIMEOUT_MS);
    assert.deepEqual(applied, [{ npcId: 'dana', forEvent: 'check', forObject: 'dana_pc', lockedOut: false }]);
    assert.equal(r.sending, false);
    hang = false;
    r.queue('dana', { event: 'fail', need: 'work', objectId: 'dana_pc', missing: [{ id: 'x', why: 'down' }] });
    await advance(2000);
    assert.equal(sent.length, 3, 'the queue sends the next batch');
    assert.equal(sent[2][0].event, 'fail');
    assert.equal(applied.length, 2);
});
