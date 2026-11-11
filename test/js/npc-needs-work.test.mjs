// Access slice 9.2 sub-slice A in the needs core (ACCESS_MODEL_SLICE_9_2_PLAN.md 5.1 to 5.6): the
// judged use and its verdict, the failed turn-back on office life's park, the dead station, the
// desk filter, failure wakes, the re-arm mark, the outage kick, the pools, visits, frustration
// from the server and the reload's hold. Stub world: fixtures/needs-work-world.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workWorld, dana, baseObjects } from './fixtures/needs-work-world.mjs';

const CHATTER = {
    work_fail_fed_up: ["That's it. I've had enough."],
    station_fail: ['This PC is useless.'],
    work_fail_no_access: ['Still no access. Nobody listens.'],
    work_fail_file_share: ["Share's down again."],
    work_fail_printer: ["Printer's jammed again."],
    work_fail: ['Why is nothing working?']
};

function stepUntil(sys, pred, maxMs = 120000) {
    for (let t = 0; t < maxMs; t += 250) { if (pred()) return true; sys.step(250); }
    return pred();
}

test('probe: _abortJob from the using phase frees the station and leaves the NPC standing', () => {
    const { sys, w } = workWorld();
    sys.registerAll();
    assert.ok(stepUntil(sys, () => sys.getState('dana').job?.phase === 'using'));
    const before = { ...w.pos.dana };
    const s = sys.states.get('dana');
    sys._abortJob(s, 'probe', { cancel: true });
    assert.equal(s.job, null);
    assert.equal(sys._claims('dana_pc', 'nobody'), 0);
    assert.deepEqual(w.pos.dana, before);
});

test('a failed use: no restore, no npc_used, npc_use_failed and a failed turn-back; grumble, drain, park, one report', () => {
    const { sys, evs, reports, log } = workWorld({ globals: { share_down: true }, chatter: CHATTER });
    sys.registerAll();
    const caffeine0 = sys.getState('dana').levels.caffeine;
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:').length > 0, 30000));
    const st = sys.getState('dana');
    assert.equal(evs('npc_used:').length, 0);
    const failed = evs('npc_use_failed:dana')[0].data;
    assert.deepEqual(failed, { npcId: 'dana', objectId: 'dana_pc', need: 'work', missing: [{ id: 'finance_share', why: 'down' }], station: false });
    const tb = evs('npc_turned_back:dana')[0].data;
    assert.equal(tb.reason, 'failed');
    assert.deepEqual(tb.missing, [{ id: 'finance_share', why: 'down' }]);
    assert.equal(st.talking.line, "Share's down again.");
    assert.equal(log('turned_back')[0].grumble, 'work_fail_file_share');
    assert.ok(st.levels.caffeine <= caffeine0 - 9.9, 'the other need is drained by breakDrain');
    assert.deepEqual(st.parked.map(p => [p.need, p.reason]), [['work', 'failed']]);
    assert.ok(st.parked[0].remainingMs > 29000 && st.parked[0].remainingMs <= 30000);
    assert.equal(st.pressing, null, 'a parked need is not pressing');
    assert.deepEqual(st.failed, { need: 'work', missing: [{ id: 'finance_share', why: 'down' }] });
    assert.deepEqual(reports, [{ npcId: 'dana', event: 'fail', need: 'work', objectId: 'dana_pc', missing: [{ id: 'finance_share', why: 'down' }] }]);
    const park = evs('npc_need_parked:dana')[0].data;
    assert.deepEqual(park.wakeOn, ['share_down']);
    sys.step(10000);
    assert.equal(sys.getState('dana').job, null, 'not selected while parked');
    assert.equal(reports.length, 1);
});

test('a failed park wakes when its downIf clears, not on a door, a room or an unrelated machine', () => {
    const { sys, set, evs, reports } = workWorld({ globals: { share_down: true, coffee_off: true } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:').length > 0, 30000));
    sys._isOff(sys.world.getObject('coffee'));   // the coffee machine has been seen off
    sys.onDoorOpened();
    sys._onRoomsLoaded(['other']);
    set('coffee_off', false);
    sys.step(3000);
    assert.equal(sys.getState('dana').parked[0]?.reason, 'failed', 'still parked');
    set('share_down', false);
    sys.step(1500);
    assert.equal(sys.getState('dana').parked.length, 0, 'woken one second later');
    assert.ok(stepUntil(sys, () => evs('npc_used:dana_pc').length > 0, 15000));
    assert.equal(evs('npc_used:dana_pc')[0].data.met, true);
    assert.equal(reports.filter(r => r.event === 'fail').length, 1);
});

test('a no_access park, or one with no_access beside a down that clears, waits out its time', () => {
    const rec = dana();
    rec.work.needs[0].admitted = false;
    const { sys, set, evs } = workWorld({ npcs: { dana: { pos: { x: 100, y: 100 }, rec } }, globals: { printer_jammed: true } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:').length > 0, 30000));
    assert.deepEqual(evs('npc_use_failed:dana')[0].data.missing, [{ id: 'finance_share', why: 'no_access' }, { id: 'printer', why: 'down' }]);
    assert.deepEqual(evs('npc_need_parked:dana')[0].data.wakeOn, []);
    set('printer_jammed', false);
    sys.step(5000);
    assert.equal(sys.getState('dana').parked[0]?.reason, 'failed');
    sys.step(26000);
    assert.equal(sys.getState('dana').parked.length, 0, 'the timer ends it');
});

test('a park on routes [["a"], ["b"]], both on, wakes when a alone clears', () => {
    const rec = dana();
    rec.work.needs = [{ id: 'email', kind: 'email', admitted: true, routes: [['a'], ['b']] }];
    const { sys, set, evs } = workWorld({ npcs: { dana: { pos: { x: 100, y: 100 }, rec } }, globals: { a: true, b: true } });
    sys.registerAll();
    sys.states.get('dana').levels.work = 50;
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:').length > 0, 30000));
    assert.deepEqual(evs('npc_need_parked:dana')[0].data.wakeOn, ['a', 'b']);
    set('a', false);
    sys.step(1500);
    assert.equal(sys.getState('dana').parked.length, 0);
});

test('a station switched off at the desk: one off park, one report, one station_fail line, the drain; woken by the station only', () => {
    const { sys, set, evs, reports, log } = workWorld({ chatter: CHATTER });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_used:dana_pc').length > 0, 30000), 'works first');
    const caffeine = sys.getState('dana').levels.caffeine;
    set('dana_pc_off', true);
    assert.ok(stepUntil(sys, () => evs('npc_need_parked:dana').length > 0, 5000), 'the kick: within one selection');
    const park = evs('npc_need_parked:dana')[0].data;
    assert.equal(park.reason, 'off');
    assert.equal(park.targetId, 'dana_pc');
    assert.equal(evs('npc_use_failed:').length, 0);
    assert.deepEqual(reports, [{ npcId: 'dana', event: 'fail', need: 'work', objectId: 'dana_pc', missing: [{ id: 'dana_pc', why: 'off' }], rearmed: true }]);
    assert.equal(sys.getState('dana').talking.line, 'This PC is useless.');
    assert.equal(log('parked')[0].grumble, 'station_fail');
    assert.ok(sys.getState('dana').levels.caffeine <= caffeine - 9.9);
    sys.onDoorOpened();
    sys.step(3000);
    assert.equal(sys.getState('dana').parked[0]?.reason, 'off');
    set('dana_pc_off', false);
    sys.step(4000);
    assert.equal(sys.getState('dana').parked.length, 1, 'retries one use time (5 s) after the switch-on');
    sys.step(1500);
    assert.equal(sys.getState('dana').parked.length, 0);
    assert.equal(evs('npc_need_parked:dana').length, 1);
});

test('a station switched off during a use: the use finishes, judged on its resources, then the off park', () => {
    const { sys, set, evs } = workWorld();
    sys.registerAll();
    assert.ok(stepUntil(sys, () => sys.getState('dana').job?.phase === 'using'));
    set('dana_pc_off', true);
    assert.ok(stepUntil(sys, () => evs('npc_used:dana_pc').length > 0, 6000));
    assert.equal(evs('npc_used:dana_pc')[0].data.met, true);
    assert.ok(stepUntil(sys, () => evs('npc_need_parked:dana').length > 0, 2000));
    assert.equal(evs('npc_need_parked:dana')[0].data.reason, 'off');
});

test('the dead PC parks whatever is in reach: a private colleague desk and a busy plain desk', () => {
    const objects = [...baseObjects(),
        { id: 'pat_pc', x: 140, y: 68, desk: true, affordance: { satisfies: 'work', useSeconds: 5, private: true, owners: ['pat'] } },
        { id: 'spare_pc', x: 160, y: 68, desk: true, affordance: { satisfies: 'work', useSeconds: 5 } }];
    const npcs = { dana: { pos: { x: 100, y: 100 }, rec: dana() },
                   bob: { pos: { x: 160, y: 100 }, rec: { id: 'bob', needsHome: 'spare_pc', needs: { work: { decayPerMin: 40, urgentAt: 50, initial: 50, jitterPct: 0 } } } } };
    const { sys, evs, log } = workWorld({ npcs, objects, globals: { dana_pc_off: true } });
    sys.registerAll();
    sys.step(5000);
    const parks = evs('npc_need_parked:dana');
    assert.equal(parks.length, 1);
    assert.equal(parks[0].data.reason, 'off');
    assert.equal(log('private_skipped').length, 0);
    assert.equal(log('job_start').length, 0, 'dana never walks to a colleague desk');
    // bob (no plan) still uses the plain PC as today
    assert.ok(log('job_start', 'bob').length > 0);
});

test('an off turn-back that finds a non-desk source counts nothing and grumbles once', () => {
    const objects = [...baseObjects(), { id: 'tablet', x: 400, y: 100, affordance: { satisfies: 'work', restores: 60, useSeconds: 3 } }];
    const npcs = { dana: { pos: { x: 300, y: 100 }, rec: dana() } };   // away from her desk
    const { sys, set, evs, reports } = workWorld({ npcs, objects, chatter: CHATTER });
    sys.registerAll();
    const s = sys.states.get('dana');
    // walking to her PC when it goes off
    assert.ok(stepUntil(sys, () => s.job?.targetId === 'dana_pc'));
    s.job.phase = 'goto_target'; s.job.offWhen = 'dana_pc_off';
    set('dana_pc_off', true);
    sys.step(250);
    assert.equal(evs('npc_turned_back:dana')[0]?.data.reason, 'off');
    assert.equal(s.job?.targetId, 'tablet', 'the fallback found the tablet');
    assert.equal(reports.length, 0);
    assert.equal(evs('npc_need_parked:dana').length, 0);
});

test('desks are never chosen for a judged work need, and are for an NPC with no plan', () => {
    const objects = [{ id: 'hot_desk', x: 140, y: 68, desk: true, affordance: { satisfies: 'work', useSeconds: 5 } },
        { id: 'plain_pc', x: 180, y: 68, desk: true, affordance: { satisfies: 'work', useSeconds: 5 } }];
    const rec = dana({ needsHome: { room: 'office', x: 3, y: 3 } });
    const plain = { id: 'kim', needsHome: { room: 'office', x: 3, y: 3 }, needs: { work: { decayPerMin: 40, urgentAt: 50, initial: 50, jitterPct: 0 } } };
    const { sys, log } = workWorld({ npcs: { dana: { pos: { x: 100, y: 100 }, rec }, kim: { pos: { x: 120, y: 100 }, rec: plain } }, objects });
    sys.registerAll();
    sys.step(30000);
    assert.equal(log('job_start').length, 0);
    assert.ok(log('job_start', 'kim').some(e => ['hot_desk', 'plain_pc'].includes(e.target)));
});

test('rearmed after a wake or a met use; not after a timer expiry', () => {
    const { sys, set, evs, reports } = workWorld({ globals: { share_down: true } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => reports.length === 1, 30000));
    assert.equal(reports[0].rearmed, undefined, 'the first fail');
    assert.ok(stepUntil(sys, () => reports.length === 2, 60000), 'the timer ends the park, then a second fail');
    assert.equal(reports[1].rearmed, undefined, 'after a timer expiry');
    set('share_down', false);
    set('share_down', true);   // cleared and thrown again before the wake: still parked, woken by the clear
    assert.ok(stepUntil(sys, () => reports.length === 3, 60000));
    assert.equal(reports[2].rearmed, true, 'after a wake by its cause clearing');
    assert.ok(evs('npc_use_failed:').length >= 3);
});

test('a met judged use with frustration reports an ease; a coffee use does not, and carries no met', () => {
    const { sys, evs, reports } = workWorld();
    sys.registerAll();
    sys.applyFrustration([{ npcId: 'dana', level: 20, previous: 0, tell: 1, settled: false, run: null }]);
    sys.states.get('dana').levels.caffeine = 5;
    assert.ok(stepUntil(sys, () => evs('npc_used:dana_pc').length > 0 && evs('npc_used:coffee').length > 0, 120000));
    assert.equal(evs('npc_used:coffee')[0].data.met, undefined);
    assert.deepEqual(reports.filter(r => r.event === 'ease').map(r => r.objectId), ['dana_pc']);
    assert.equal(sys.getState('dana').frustration, 20);
    assert.equal(sys.world.getObject('dana_pc') && true, true);
});

test('the outage kick: a need at 90 drops to urgentAt once when its downIf turns on, and fails within one use time', () => {
    const { sys, set, evs, log } = workWorld();
    sys.registerAll();
    sys.states.get('dana').levels.work = 90;
    sys.step(500);
    set('printer_jammed', true);
    sys.step(250);
    assert.equal(log('kicked').length, 1);
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:').length > 0, 6000), 'within one use time');
    set('printer_jammed', true);   // the same value again: no second kick
    sys.step(500);
    assert.equal(log('kicked').length, 1);
});

test('a global already on at register kicks; a parked need is not kicked and keeps its level', () => {
    const { sys, log, evs } = workWorld({ globals: { share_down: true } });
    sys.registerAll();
    sys.step(250);
    assert.equal(log('kicked').length, 1);
    assert.ok(stepUntil(sys, () => evs('npc_need_parked:').length > 0, 10000));
    const s = sys.states.get('dana');
    const held = s.levels.work;
    sys.world.globalHolds = () => true;   // every global on: a change for the kick to see
    s.kickSeen = {};
    sys.step(250);
    assert.equal(s.levels.work, held, 'the parked level is untouched');
});

test('the off line inside another need\'s fallback: said once; an off turn-back for work grumbles once', () => {
    const npcs = { dana: { pos: { x: 300, y: 280 }, rec: dana() } };
    const { sys, set, evs, log, g } = workWorld({ npcs, chatter: CHATTER });
    sys.registerAll();
    const s = sys.states.get('dana');
    s.levels.caffeine = 5;
    s.levels.work = 90;
    assert.ok(stepUntil(sys, () => s.job?.targetId === 'coffee'));
    g.dana_pc_off = true;   // her PC dies while she is away
    s.levels.work = 40;   // urgent now: the coffee fallback evaluates it
    s.job.phase = 'goto_target'; s.job.offWhen = 'coffee_off';
    set('coffee_off', true);
    sys.step(250);
    const parks = log('parked').filter(e => e.need === 'work');
    assert.equal(parks.length, 1);
    assert.equal(parks[0].grumble, 'station_fail');
    assert.equal(evs('npc_need_parked:dana').filter(e => e.data.need === 'work')[0].data.reason, 'off');
    assert.equal(log('turned_back')[0].reason, 'off');
    // an off turn-back for work itself: one grumble (the turn-back's), none from the fallback's park
    const t = workWorld({ npcs: { dana: { pos: { x: 300, y: 280 }, rec: dana() } }, chatter: CHATTER });
    t.sys.registerAll();
    const d = t.sys.states.get('dana');
    assert.ok(stepUntil(t.sys, () => d.job?.targetId === 'dana_pc'));
    d.job.phase = 'goto_target'; d.job.offWhen = 'dana_pc_off';
    t.g.dana_pc_off = true;
    t.sys.step(250);
    assert.equal(t.log('turned_back')[0].grumble, 'station_fail');
    const workParks = t.log('parked').filter(e => e.need === 'work');
    assert.equal(workParks.length, 1);
    assert.equal(workParks[0].grumble, undefined, 'no second line');
});

test('a reload\'s hold parks the need held, uncounted and silent; a door does not wake it; the first fail comes after', () => {
    const { sys, evs, reports } = workWorld({ globals: { share_down: true } });
    sys.restoreFrustration({ dana: { level: 34, tell: 1, settled: false, hold: { work: 10 } } });
    sys.registerAll();
    const st = sys.getState('dana');
    assert.equal(st.frustration, 34);
    assert.deepEqual(st.parked.map(p => p.reason), ['held']);
    sys.onDoorOpened();
    sys.step(5000);
    assert.equal(reports.length, 0);
    assert.equal(sys.getState('dana').parked[0]?.reason, 'held');
    assert.ok(stepUntil(sys, () => reports.length === 1, 20000));
    assert.ok(sys.clockMs >= 10000);
    assert.equal(evs('npc_frustration_changed:dana').length, 0, 'a restore is no change (review R2 m1)');
});

test('the pool follows the tell held at the failure; a kind with no pool falls back to work_fail', () => {
    const run = (tell, chatter) => {
        const { sys, log } = workWorld({ globals: { share_down: true }, chatter });
        sys.registerAll();
        sys.applyFrustration([{ npcId: 'dana', level: 50, tell }]);
        stepUntil(sys, () => log('turned_back').length > 0, 30000);
        return { topic: log('turned_back')[0].grumble, talking: sys.getState('dana').talking };
    };
    assert.equal(run(2, CHATTER).topic, 'work_fail_fed_up');
    assert.equal(run(1, CHATTER).topic, 'work_fail_file_share');
    assert.equal(run(1, { work_fail: ['Why?'] }).topic, 'work_fail');
    const pic = run(1, {});
    assert.equal(pic.topic, 'work_fail_file_share');
    assert.equal(pic.talking.picture, 'file');
});

test('a check visit walks to the object once per outage, claims nothing and emits no npc_used', () => {
    const { sys, evs, log } = workWorld({ globals: { printer_jammed: true } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_visit_done:dana').length > 0, 40000));
    assert.equal(evs('npc_checked:office_printer').length, 1);
    assert.equal(evs('npc_used:office_printer').length, 0);
    assert.ok(evs('npc_left_post:dana').some(e => e.data.targetId === 'office_printer'));
    stepUntil(sys, () => evs('npc_use_failed:').length >= 3, 120000);
    assert.equal(evs('npc_checked:office_printer').length, 1, 'once per outage');
    assert.equal(log('visit_queued').length, 1);
});

test('a visit waits for a running job; a late answer changes no decision; a level before register applies at register', () => {
    const a = workWorld();
    a.sys.registerAll();
    assert.ok(stepUntil(a.sys, () => a.sys.getState('dana').job?.phase === 'using'));
    a.sys.enqueueVisit('dana', { kind: 'check', at: { objectId: 'office_printer' } });
    a.sys.step(250);
    assert.equal(a.sys.getState('dana').job.kind, 'use', 'not interrupted');
    assert.ok(stepUntil(a.sys, () => a.sys.getState('dana').job?.kind === 'visit', 10000));

    // The late answer here is tell 1, which leaves the pool as it was. A tell 2 answer does change
    // the grumble topic (work_fail_fed_up, plan 5.5), by design, so it is not used here.
    const runLog = late => {
        const { sys } = workWorld({ globals: { share_down: true } });
        sys.registerAll();
        sys.step(20000);
        if (late) sys.applyFrustration([{ npcId: 'dana', level: 20, tell: 1 }]);
        sys.step(40000);
        return JSON.stringify(sys.getLog().filter(e => e.ev !== 'frustration'));
    };
    assert.equal(runLog(true), runLog(false));

    const b = workWorld();
    b.sys.applyFrustration([{ npcId: 'dana', level: 40, tell: 2 }]);
    b.sys.step(250);
    b.sys.registerAll();
    assert.equal(b.sys.getState('dana').frustration, 40);
    assert.equal(b.sys.getState('dana').tell, 2);
});

// ── review R1 (client m1, m3, m4, m5, m9) ──────────────────────────────

test('R1 m1: a visit to the NPC\'s own needsHome object is at post: no npc_left_post, no move', () => {
    const { sys, w, evs } = workWorld();
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_used:dana_pc').length > 0, 30000));
    sys.step(500);
    const moves = w.calls.moves.length;
    const left = evs('npc_left_post:dana').length;
    sys.enqueueVisit('dana', { kind: 'check', at: { objectId: 'dana_pc' }, useSeconds: 1 });
    assert.ok(stepUntil(sys, () => evs('npc_visit_done:dana').length > 0, 10000));
    assert.equal(evs('npc_left_post:dana').length, left, 'never left the desk');
    assert.equal(evs('npc_action_windup:dana').filter(e => e.data.targetId === 'dana_pc').length, 0);
    assert.equal(w.calls.moves.length, moves, 'not moved');
});

test('R1 m9: a visit to an NPC walks to the world\'s cellBeside', () => {
    const { sys, w, evs } = workWorld({ npcs: { dana: { pos: { x: 100, y: 100 }, rec: dana() }, omar: { pos: { x: 400, y: 400 }, rec: { id: 'omar' } } } });
    w.world.cellBeside = id => (id === 'omar' ? { x: 432, y: 400 } : null);
    sys.registerAll();
    sys.enqueueVisit('dana', { kind: 'visit', at: { npcId: 'omar' }, useSeconds: 1 });
    assert.ok(stepUntil(sys, () => evs('npc_visit_done:dana').length > 0, 30000));
    assert.ok(w.calls.moves.some(m => m.id === 'dana' && m.x === 432 && m.y === 400));
});

test('R1 m4: npc_frustration_changed carries the answer\'s previous, else the mirror', () => {
    const { sys, evs } = workWorld();
    sys.registerAll();
    sys.applyFrustration([{ npcId: 'dana', level: 90, previous: 100, tell: 2 }]);
    sys.step(250);
    assert.equal(evs('npc_frustration_changed:dana').at(-1).data.previous, 100);
    sys.applyFrustration([{ npcId: 'dana', level: 80, tell: 2 }]);
    sys.step(250);
    assert.equal(evs('npc_frustration_changed:dana').at(-1).data.previous, 90);
});

test('R1 m3: an ease is reported after a fail even while the mirror still says 0; a reset keeps the mirror', () => {
    const { sys, set, evs, reports } = workWorld({ globals: { share_down: true } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => reports.length === 1, 30000));
    assert.equal(sys.getState('dana').frustration, 0, 'no answer yet');
    set('share_down', false);
    assert.ok(stepUntil(sys, () => evs('npc_used:dana_pc').length > 0, 20000));
    assert.deepEqual(reports.map(r => r.event), ['fail', 'ease']);
    assert.ok(stepUntil(sys, () => evs('npc_used:dana_pc').length > 1, 180000));
    assert.equal(reports.length, 2, 'one owed ease only; the next met use at 0 sends none');

    sys.applyFrustration([{ npcId: 'dana', level: 40, previous: 50, tell: 1 }]);
    sys.step(250);
    sys.reset();
    const st = sys.getState('dana');
    assert.equal(st.frustration, 40);
    assert.equal(st.tell, 1);
});

test('R1 m5: an off non-desk source (a kiosk) is never a counted fail', () => {
    const rec = dana({ needsHome: { room: 'office', x: 3, y: 3 } });
    const objects = [
        { id: 'kiosk', x: 200, y: 200, affordance: { satisfies: 'work', restores: 60, useSeconds: 5, offWhen: 'kiosk_off' } },
        { id: 'coffee', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10, offWhen: 'coffee_off' } }
    ];
    const { sys, evs, reports } = workWorld({ npcs: { dana: { pos: { x: 96, y: 96 }, rec } }, objects, globals: { kiosk_off: true } });
    sys.registerAll();
    sys.states.get('dana').levels.work = 40;
    assert.ok(stepUntil(sys, () => evs('npc_need_parked:dana').length > 0, 20000));
    // Today an off give-up names only the dead own station (_giveUpReason), so the kiosk parks
    // as office life always did; the guard in _select keeps it so if that ever changes
    assert.notEqual(evs('npc_need_parked:dana')[0].data.targetId, 'kiosk');
    assert.equal(reports.length, 0, 'no fail report for a kiosk');
    assert.equal(sys.getLog().filter(e => e.ev === 'failure_counted').length, 0);
});

test('R1 m9: the outage kick waits while the home is provisional', () => {
    const objects = baseObjects();
    objects[0].roomId = null;   // dana_pc not loaded yet
    const { sys, w, log } = workWorld({ objects, globals: { printer_jammed: true } });
    sys.registerAll();
    sys.step(2000);
    assert.equal(log('kicked').length, 0, 'no kick while the home is provisional');
    w.objs.find(o => o.id === 'dana_pc').roomId = 'office';
    sys.step(3000);
    assert.equal(log('kicked').length, 1, 'the kick once the home resolves');
});

test('R1 m9 (R5 n3): a reload\'s hold is less the time since the response arrived', () => {
    let elapsed = 0;
    const { sys, w, reports } = workWorld({ globals: { share_down: true } });
    w.world.elapsedMs = () => elapsed;
    sys.restoreFrustration({ dana: { level: 34, tell: 1, settled: false, hold: { work: 10 } } });
    elapsed = 6000;
    sys.registerAll();
    const held = sys.getState('dana').parked.find(p => p.reason === 'held');
    assert.ok(held && held.remainingMs <= 4000 && held.remainingMs > 3500, `held ${held?.remainingMs}`);
    assert.ok(stepUntil(sys, () => reports.length === 1, 20000));
    assert.ok(sys.clockMs < 10000, 'the fail comes before the full ten seconds');
});

// ── review R2 (client m1, m3, m4, m5) ──────────────────────────────────

test('R2 m1: a restore sets the mirror with no npc_frustration_changed, and writes the global only when it differs', () => {
    const a = workWorld();
    a.sys.restoreFrustration({ dana: { level: 24, tell: 1, settled: false } });
    a.sys.registerAll();
    a.sys.step(500);
    const st = a.sys.getState('dana');
    assert.equal(st.frustration, 24);
    assert.equal(st.tell, 1);
    assert.equal(a.evs('npc_frustration_changed:').length, 0, 'no rise from 0 at load');
    assert.equal(a.w.calls.globals.dana_frustration, 24, 'written when the saved global is missing');

    const b = workWorld();
    b.w.world.getGlobal = name => (name === 'dana_frustration' ? 24 : undefined);
    b.sys.registerAll();
    b.sys.restoreFrustration({ dana: { level: 24, tell: 1, settled: false } });
    assert.equal(b.sys.getState('dana').frustration, 24);
    assert.ok(!('dana_frustration' in b.w.calls.globals), 'the saved global already says 24: not rewritten');
    assert.equal(b.evs('npc_frustration_changed:').length, 0);

    // A real answer afterwards still fires, with the restored level as its previous
    b.sys.applyFrustration([{ npcId: 'dana', level: 44, previous: 24, tell: 2 }]);
    b.sys.step(250);
    assert.deepEqual(b.evs('npc_frustration_changed:dana').map(e => [e.data.level, e.data.previous]), [[44, 24]]);
});

test('R2 n3: a pending answer applies over the restored entry, not under it', () => {
    const { sys } = workWorld();
    sys.applyFrustration([{ npcId: 'dana', level: 58, previous: 24, tell: 2 }]);
    sys.step(250);
    sys.restoreFrustration({ dana: { level: 24, tell: 1, settled: false } });
    sys.registerAll();
    assert.equal(sys.getState('dana').frustration, 58);
});

test('R2 m3: an off station counts while the home is still provisional (the station is needsHome)', () => {
    const { sys, set, reports, log } = workWorld();
    sys.registerAll();
    sys.step(250);
    const s = sys.states.get('dana');
    s.home = { ...s.home, objectId: null, provisional: true };
    s.homeRetryAt = Infinity;
    set('dana_pc_off', true);
    s.levels.work = 40;
    assert.ok(stepUntil(sys, () => log('failure_counted').length > 0, 20000), 'counted');
    assert.deepEqual(reports.map(r => [r.event, r.missing]), [['fail', [{ id: 'dana_pc', why: 'off' }]]]);
});

test('R1 m10: a tempted work job that fails parks, counts and reports once', () => {
    const { sys, reports, log } = workWorld({ globals: { share_down: true } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => sys.states.get('dana').job?.need === 'work', 30000));
    sys.states.get('dana').job.tempted = true;
    assert.ok(stepUntil(sys, () => log('failure_counted').length > 0, 30000));
    assert.deepEqual(sys.getState('dana').parked.map(p => [p.need, p.reason]), [['work', 'failed']]);
    sys.step(10000);
    assert.equal(reports.length, 1, 'parked: no retry at once');
});

test('breakDrain: an authored value drains the other needs by it, capped at 50', () => {
    const run = drain => {
        const rec = dana();
        rec.work.breakDrain = drain;
        rec.needs.caffeine.initial = 90;
        const { sys, evs } = workWorld({ npcs: { dana: { pos: { x: 100, y: 100 }, rec } }, globals: { share_down: true } });
        sys.registerAll();
        const before = sys.getState('dana').levels.caffeine;
        stepUntil(sys, () => evs('npc_use_failed:').length > 0, 30000);
        return before - sys.getState('dana').levels.caffeine;
    };
    const d30 = run(30);
    assert.ok(d30 >= 30 && d30 < 31, `drain 30 gave ${d30}`);
    const d80 = run(80);
    assert.ok(d80 >= 50 && d80 < 51, `drain 80 gave ${d80}`);
});

test('R2 m5: a check visit cut short by its walk deadline is dropped, and frees its resource for the next outage', () => {
    const { sys, evs } = workWorld({ globals: { printer_jammed: true } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => sys.states.get('dana').job?.kind === 'visit' && sys.states.get('dana').job.phase === 'goto_target', 40000));
    const s = sys.states.get('dana');
    assert.ok(s.checked.has('printer'));
    // The stub world arrives on the next tick, so the walk deadline's own call is made here
    sys._failJob(s, 'timeout');
    const dropped = evs('npc_visit_dropped:dana');
    assert.equal(dropped.length, 1);
    assert.equal(dropped[0].data.reason, 'timeout');
    assert.equal(dropped[0].data.kind, 'check');
    assert.equal(evs('npc_visit_done:dana').length, 0);
    assert.equal(evs('npc_checked:office_printer').length, 0);
    assert.ok(!s.checked.has('printer'), 'the next failure queues the check again');
});


test('q17: causeCleared once the outage of the last counted failure is over; false again at the next failure', () => {
    const { sys, set, log } = workWorld({ globals: { share_down: true } });
    sys.registerAll();
    assert.equal(sys.getState('dana').causeCleared, false, 'nothing counted yet');
    assert.ok(stepUntil(sys, () => log('failure_counted').length > 0, 30000));
    assert.equal(sys.getState('dana').causeCleared, false, 'the share is still down');
    set('share_down', false);
    assert.equal(sys.getState('dana').causeCleared, true);
    set('share_down', true);
    assert.equal(sys.getState('dana').causeCleared, false, 'down again: the recorded cause holds');
});

test('q17: a switched-off station clears when its offWhen no longer holds', () => {
    const { sys, set, log } = workWorld();
    sys.registerAll();
    sys.step(250);
    const s = sys.states.get('dana');
    s.home = { ...s.home, objectId: null, provisional: true };
    s.homeRetryAt = Infinity;
    set('dana_pc_off', true);
    s.levels.work = 40;
    assert.ok(stepUntil(sys, () => log('failure_counted').length > 0, 20000));
    assert.equal(sys.getState('dana').causeCleared, false);
    set('dana_pc_off', false);
    assert.equal(sys.getState('dana').causeCleared, true);
});
