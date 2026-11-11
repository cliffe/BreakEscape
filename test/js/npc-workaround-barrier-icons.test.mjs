// Access slice 9.2, user decisions q21 and q27: the npc-workaround and npc-barrier icons.
// workaround: an NPC doing a workaround (a workaround visit, a borrowed PC's use, just after an
// emit). barrier: just after a counted failure of a judged use, shown once the failure's line has
// gone. blocked keeps its office-life meaning and stays the standing frustration icon (q17 fade).
// Pure entries from systems/npc-action-icons.js; the needs side on fixtures/needs-work-world.mjs.
// Run with: bin/test-js test/js/npc-workaround-barrier-icons.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickIconEntry, stateIconEntry, DEFAULT_ICONS, NPC_ICON_NAMES, FADED_ALPHA, resolveIcon } from '../../public/break_escape/js/systems/npc-action-icons.js';
import { PICTURE_CHATTER, FAIL_SHOW_MS, WORKAROUND_SHOW_MS } from '../../public/break_escape/js/systems/npc-needs.js';
import { NpcWorkarounds } from '../../public/break_escape/js/systems/npc-workarounds.js';
import { workWorld, baseObjects } from './fixtures/needs-work-world.mjs';

const judged = { work: true, social_media: false };
const FAILED = { need: 'work', missing: [{ id: 'finance_share', why: 'down' }] };

function stepUntil(sys, pred, maxMs = 120000) {
    for (let t = 0; t < maxMs; t += 250) { if (pred()) return true; sys.step(250); }
    return pred();
}

test('the two icons are in the set, by name, with text stand-ins', () => {
    for (const n of ['workaround', 'barrier']) {
        assert.ok(NPC_ICON_NAMES.includes(n), n);
        assert.equal(DEFAULT_ICONS[n], `icon:npc-${n}`);
        assert.deepEqual(resolveIcon(DEFAULT_ICONS[n]), { kind: 'sprite', key: `icon:npc-${n}`, path: `icons/npc-${n}.png`, glyph: '•' });
    }
    assert.equal(DEFAULT_ICONS.blocked, 'icon:npc-blocked', 'blocked is not replaced');
});

test('a job: a workaround visit or a borrowed use shows workaround; a check visit still shows work; a queue wins', () => {
    assert.equal(pickIconEntry({ kind: 'visit', workaround: true }, {}).key, 'workaround');
    assert.equal(pickIconEntry({ kind: 'use', need: 'work', workaround: true }, {}, { id: 'hot_desk', type: 'pc', satisfies: 'work' }).key, 'workaround');
    assert.equal(pickIconEntry({ kind: 'visit', workaround: false }, {}).key, 'work');
    assert.equal(pickIconEntry({ kind: 'use', need: 'work', workaround: true, phase: 'queued' }, {}).key, 'queue');
    assert.deepEqual(pickIconEntry({ kind: 'visit', workaround: true }, { workaround: 'W' }), { key: 'workaround', value: 'W' }, 'a scenario entry wins');
    // An ordinary use is untouched
    assert.equal(pickIconEntry({ kind: 'use', need: 'work' }, {}, { id: 'dana_pc', type: 'pc', satisfies: 'work' }).key, 'work');
});

test('no job: barrier just after a failure, solid, ahead of the frustration icon at any tell', () => {
    for (const tell of [0, 1, 2]) {
        const e = stateIconEntry({ job: null, tell, judged, failed: FAILED }, {}, false);
        assert.equal(e.key, 'barrier', `tell ${tell}`);
        assert.equal(e.value, 'icon:npc-barrier');
        assert.ok(!e.pulse && !e.fading, 'solid, no pulse');
    }
    // and ahead of a cleared cause too: the newest failure shows first
    assert.equal(stateIconEntry({ job: null, tell: 2, judged, failed: FAILED, causeCleared: true }, {}, false).key, 'barrier');
});

test('q17 still holds once the barrier moment is over: blocked, pulsing at 2, faded when the cause clears', () => {
    const solid = stateIconEntry({ job: null, tell: 2, judged, failed: null }, {}, false);
    assert.equal(solid.key, 'blocked');
    assert.equal(solid.pulse, true);
    const faded = stateIconEntry({ job: null, tell: 2, judged, failed: null, causeCleared: true }, {}, false);
    assert.equal(faded.key, 'blocked');
    assert.equal(faded.fading, true);
    assert.equal(faded.alpha, FADED_ALPHA[2]);
    assert.equal(stateIconEntry({ job: null, tell: 0, judged, causeCleared: true }, {}, false), null);
});

test('no job: an emit workaround beats the barrier; noticed beats both only where it shows', () => {
    assert.equal(stateIconEntry({ job: null, tell: 2, judged, failed: FAILED, workaround: true }, {}, false).key, 'workaround');
    assert.equal(stateIconEntry({ job: null, tell: 1, judged, workaround: true }, {}, false).key, 'workaround');
    assert.equal(stateIconEntry({ job: null, tell: 1, judged, failed: FAILED, noticed: true }, {}, true).key, 'noticed', 'opted in: noticed first');
    assert.equal(stateIconEntry({ job: null, tell: 1, judged, failed: FAILED, noticed: true }, {}, false).key, 'barrier', 'noticed not shown: the barrier is');
    // A scenario's own entries win, as for every key
    assert.deepEqual(stateIconEntry({ job: null, failed: FAILED }, { barrier: 'B' }, false), { key: 'barrier', value: 'B' });
});

test('an office-life state is unchanged: leashed blocked, noticed, nothing at all', () => {
    assert.deepEqual(stateIconEntry({ job: null, blockedNeed: 'caffeine' }, {}, true), { key: 'blocked', value: 'icon:npc-blocked' });
    assert.equal(stateIconEntry({ job: null, blockedNeed: 'caffeine' }, {}, false), null);
    assert.equal(stateIconEntry({ job: null, noticed: true }, {}, true).key, 'noticed');
    assert.equal(stateIconEntry({ job: null }, {}, true), null);
    assert.equal(stateIconEntry({ job: null, failed: null, workaround: false }, {}, true), null);
});

test('pictures: a failure or refusal shows barrier, a workaround start line workaround; office life keeps blocked', () => {
    for (const t of ['station_fail', 'work_fail_no_access', 'work_fail_fed_up', 'social_blocked', 'usb_refused']) {
        assert.deepEqual(PICTURE_CHATTER[t], ['barrier'], t);
    }
    for (const t of ['wk_writes_down', 'wk_prop_door', 'wk_borrow', 'wk_share_login']) {
        assert.deepEqual(PICTURE_CHATTER[t], ['workaround'], t);
    }
    assert.deepEqual(PICTURE_CHATTER.grumble_printer_off, ['blocked'], 'slice 22 printers unchanged');
    assert.deepEqual(PICTURE_CHATTER.work_fail, ['work']);
});

test('needs: getState().failed lasts FAIL_SHOW_MS after the failure line has gone, so the barrier is seen', () => {
    const { sys, evs } = workWorld({ globals: { share_down: true }, chatter: { work_fail_file_share: ["Share's down again."] } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:dana').length > 0, 30000));
    assert.ok(sys.getState('dana').talking, 'the line is up');
    assert.ok(stepUntil(sys, () => !sys.getState('dana').talking, 20000));
    const st = sys.getState('dana');
    assert.deepEqual(st.failed, FAILED, 'still failed after the line');
    assert.equal(stateIconEntry(st, {}, false).key, 'barrier');
    sys.step(FAIL_SHOW_MS + 250);
    const later = sys.getState('dana');
    assert.equal(later.failed, null);
    assert.notEqual(stateIconEntry(later, {}, false)?.key, 'barrier');
});

test('needs: a workaround visit and a borrowed use carry job.workaround; an ordinary use does not', () => {
    const HOT = { id: 'hot_desk', x: 400, y: 68, desk: true, affordance: { satisfies: 'work', restores: 60, useSeconds: 5 } };
    const { sys, evs } = workWorld({ objects: [...baseObjects(), HOT], globals: { dana_pc_off: true } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_need_parked:dana').length > 0, 30000));
    assert.equal(sys.setBorrow('dana', { index: 1, hand: 1, do: 'borrow_session', pc: 'hot_desk', need: 'work', dwell: 2 }), true);
    sys.step(250);
    const st = sys.getState('dana');
    assert.equal(st.job?.targetId, 'hot_desk');
    assert.equal(st.job.workaround, true);
    assert.equal(pickIconEntry(st.job, {}, { id: 'hot_desk', satisfies: 'work' }).key, 'workaround');

    const v = workWorld();
    v.sys.registerAll();
    assert.ok(stepUntil(v.sys, () => v.sys.getState('dana').job?.kind === 'use'));
    assert.equal(v.sys.getState('dana').job.workaround, false, 'an ordinary use');
    assert.ok(v.sys.enqueueVisit('dana', { kind: 'workaround', at: { objectId: 'dana_pc' }, useSeconds: 4, data: { workaround: { index: 0, hand: 1, do: 'writes_down' } } }));
    assert.ok(stepUntil(v.sys, () => v.sys.getState('dana').visiting?.kind === 'workaround', 60000));
    assert.equal(v.sys.getState('dana').job.workaround, true);
    // Done: the icon stays WORKAROUND_SHOW_MS with no job, so a visit hidden by its start line is seen
    assert.ok(stepUntil(v.sys, () => v.evs('npc_visit_done:dana').length > 0, 30000));
    const after = v.sys.getState('dana');
    assert.equal(after.workaround, true);
    assert.equal(after.job, null, 'no job hides it');
    assert.equal(stateIconEntry(after, {}, false).key, 'workaround');
    v.sys.step(WORKAROUND_SHOW_MS + 250);
    assert.equal(v.sys.getState('dana').workaround, false);
});

test('needs: showWorkaround shows the icon for WORKAROUND_SHOW_MS (after any line); the emit runner calls it', () => {
    const { sys } = workWorld();
    sys.registerAll();
    assert.equal(sys.getState('dana').workaround, false);
    assert.equal(sys.showWorkaround('dana'), true);
    assert.equal(sys.showWorkaround('nobody'), false);
    assert.equal(sys.getState('dana').workaround, true);
    sys.step(WORKAROUND_SHOW_MS + 250);
    assert.equal(sys.getState('dana').workaround, false);

    const shown = [];
    const runner = new NpcWorkarounds({
        send: async () => ({}), emit: () => {}, setTimer: () => {},
        needs: () => ({ showWorkaround: id => { shown.push(id); return true; }, mutter: () => true, enqueueVisit: () => true })
    });
    runner.due({ npcId: 'ellis', run: { index: 0, hand: 1, do: 'emit', dwell: 0, event: 'ellis_gave_up' }, level: 20 });
    assert.deepEqual(shown, ['ellis']);
    runner.due({ npcId: 'mei', run: { index: 0, hand: 1, do: 'writes_down', dwell: 6 }, level: 50 });
    assert.deepEqual(shown, ['ellis'], 'a visit shows its icon through the job instead');
});


// Review R1 M2: q27's "timed from the end of the line", with a line longer than FAIL_SHOW_MS
const LONG = 'The file share is down again, and the report is due today.';   // over 30 characters: a 4 s bubble

test('needs: with a 4 s failure line the barrier still shows 3 s after the line has gone', () => {
    const { sys, evs } = workWorld({ globals: { share_down: true }, chatter: { work_fail_file_share: [LONG] } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:dana').length > 0, 30000));
    assert.ok(sys.getState('dana').talking, 'the line is up');
    assert.ok(stepUntil(sys, () => !sys.getState('dana').talking, 20000));
    sys.step(3000);
    const st = sys.getState('dana');
    assert.deepEqual(st.failed, FAILED, 'still failed 3 s after the line');
    assert.equal(stateIconEntry(st, {}, false).key, 'barrier');
});

test('needs: showWorkaround during a line shows the icon for WORKAROUND_SHOW_MS after it', () => {
    const { sys } = workWorld({ chatter: { work_fail: [LONG] } });
    sys.registerAll();
    assert.equal(sys.mutter('dana', 'work_fail'), true);
    assert.ok(sys.getState('dana').talking, 'the line is up');
    assert.equal(sys.showWorkaround('dana'), true);
    assert.ok(stepUntil(sys, () => !sys.getState('dana').talking, 20000));
    sys.step(3000);
    assert.equal(sys.getState('dana').workaround, true, 'still shown 3 s after the line');
});

// Review R1 M1: the first failure against a down resource with an object queues a check visit;
// the visit waits until the barrier has shown, so a job's icon does not hide it
test('needs: the first failure on a down printer shows the barrier after its line, then the check visit starts', () => {
    const { sys, evs } = workWorld({ globals: { printer_jammed: true }, chatter: { work_fail_printer: [LONG] } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:dana').length > 0, 30000));
    assert.equal(sys.getState('dana').visits.length, 1, 'a check visit is queued');
    assert.ok(stepUntil(sys, () => !sys.getState('dana').talking, 20000));
    let barrierTicks = 0;
    for (let t = 0; t < FAIL_SHOW_MS; t += 250) {
        sys.step(250);
        const st = sys.getState('dana');
        if (st.failed) {
            assert.equal(st.visiting, null, 'no visit while the barrier shows');
            if (stateIconEntry(st, {}, false)?.key === 'barrier') barrierTicks++;
        }
    }
    assert.ok(barrierTicks >= 12, `barrier drawn for ${barrierTicks} ticks`);
    assert.ok(stepUntil(sys, () => sys.getState('dana').visiting?.kind === 'check', 10000), 'then off to check');
    assert.equal(sys.getState('dana').failed, null);
});

test('needs: a queued check visit also waits out an emit\'s workaround icon', () => {
    const { sys } = workWorld();
    sys.registerAll();
    assert.equal(sys.showWorkaround('dana'), true);
    assert.ok(sys.enqueueVisit('dana', { kind: 'check', at: { objectId: 'office_printer' }, data: { resourceId: 'printer' } }));
    sys.step(WORKAROUND_SHOW_MS - 500);
    assert.equal(sys.getState('dana').job, null, 'held, and nothing else started');
    assert.equal(sys.getState('dana').workaround, true);
    assert.ok(stepUntil(sys, () => sys.getState('dana').visiting?.kind === 'check', 10000));
});

// Review R1 m1: a borrowed PC's use keeps the icon after it, as a workaround visit does
test('needs: a borrowed use keeps the workaround icon WORKAROUND_SHOW_MS after it is done', () => {
    const HOT = { id: 'hot_desk', x: 160, y: 68, desk: true, affordance: { satisfies: 'work', restores: 60, useSeconds: 3 } };
    const { sys, evs } = workWorld({ objects: [...baseObjects(), HOT], globals: { dana_pc_off: true } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_need_parked:dana').length > 0, 30000));
    assert.equal(sys.setBorrow('dana', { index: 1, hand: 1, do: 'borrow_session', pc: 'hot_desk', need: 'work', dwell: 2 }), true);
    assert.ok(stepUntil(sys, () => evs('npc_borrow_done:dana').length > 0, 30000));
    const after = sys.getState('dana');
    assert.equal(after.job, null);
    assert.equal(after.workaround, true);
    assert.equal(stateIconEntry(after, {}, false).key, 'workaround');
    sys.step(WORKAROUND_SHOW_MS + 250);
    assert.equal(sys.getState('dana').workaround, false);
});

// Review R1 m4: another job clears the workaround icon, so it does not come back after that job
test('needs: a job starting clears an emit\'s workaround icon', () => {
    const { sys } = workWorld();
    sys.registerAll();
    assert.ok(stepUntil(sys, () => { if (!sys.getState('dana').job) sys.showWorkaround('dana'); return !!sys.getState('dana').job; }, 60000));
    assert.equal(sys.getState('dana').workaround, false);
});
