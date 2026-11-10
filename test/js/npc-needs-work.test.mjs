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
    assert.equal(evs('npc_frustration_changed:dana')[0].data.level, 34);
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
