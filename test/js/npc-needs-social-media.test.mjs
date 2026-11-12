// Access slice 9.2 sub-slice C in the needs core (ACCESS_MODEL_SLICE_9_2_PLAN.md 8.1 and 8.2): the
// social_media candidate order, the phone as a `self` job, the at-desk use with socialUse, the
// blocked PC, the dead station with and without a phone, freeze and knock-out, and the sight
// challenge held off while the NPC is distracted.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workWorld } from './fixtures/needs-work-world.mjs';
import npcWork from '../../public/break_escape/js/systems/npc-work.js';
import { pickIconEntry } from '../../public/break_escape/js/systems/npc-action-icons.js';
import { createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';

const CHATTER = { social_blocked: ['Blocked. Of course.'] };

function stepUntil(sys, pred, maxMs = 120000) {
    for (let t = 0; t < maxMs; t += 250) { if (pred()) return true; sys.step(250); }
    return pred();
}

function jake(extra = {}) {
    return {
        id: 'jake', needsHome: 'jake_pc', needsDeferMin: 0.5,
        needs: { social_media: { decayPerMin: 60, urgentAt: 40, initial: 45, jitterPct: 0 } },
        ...extra
    };
}

function objects({ blocked = true, kiosk = false, tablet = false, otherDesk = false } = {}) {
    const out = [{ id: 'jake_pc', x: 100, y: 68, desk: true, socialBlocked: blocked,
        affordance: { satisfies: 'work', restores: 10, useSeconds: 5, offWhen: 'jake_pc_off' } }];
    if (tablet) out.push({ id: 'tablet', x: 300, y: 300, affordance: { satisfies: 'social_media', restores: 50, useSeconds: 6 } });
    if (kiosk) out.push({ id: 'kiosk', x: 400, y: 300, desk: true, affordance: { satisfies: 'social_media', restores: 50, useSeconds: 6 } });
    if (otherDesk) out.push({ id: 'lena_pc', x: 200, y: 68, desk: true, affordance: { satisfies: 'social_media', restores: 50, useSeconds: 6 } });
    return out;
}

/** The needs work world with a verdict that reads the station's socialBlocked, as the live adapter does. */
function socialWorld({ rec = jake(), objs = objects(), globals = {} } = {}) {
    const npcs = { jake: { pos: { x: 100, y: 100 }, rec } };
    const out = workWorld({ npcs, objects: objs, globals: { jake_pc_off: false, ...globals }, chatter: CHATTER, seed: 'social' });
    out.w.world.useVerdict = (npcId, need, obj) => {
        const station = obj && obj.id === rec.needsHome ? { id: obj.id, lockedOut: false, socialBlocked: !!obj.socialBlocked } : null;
        return npcWork.useVerdict(rec.work, need, station, out.g);
    };
    out.w.world.playerProximity = () => ({ nearby: true, distance: 40 });
    return out;
}

test('a phone use at the post: no npc_left_post, stays at its post, distracted, npc_used_phone and no npc_used', () => {
    const { sys, w, evs } = socialWorld();
    sys.registerAll();
    assert.ok(stepUntil(sys, () => sys.getState('jake').atPost === true && sys.getState('jake').mode === 'idle', 5000));
    assert.ok(stepUntil(sys, () => sys.getState('jake').job?.kind === 'self', 30000));
    const st = sys.getState('jake');
    assert.deepEqual({ kind: st.job.kind, need: st.job.need, phase: st.job.phase, targetId: st.job.targetId },
        { kind: 'self', need: 'social_media', phase: 'using', targetId: null });
    assert.equal(st.distracted, true);
    assert.equal(sys.isDistracted('jake'), true);
    assert.equal(st.atPost, true);
    const movesBefore = w.calls.moves.length;
    assert.ok(stepUntil(sys, () => evs('npc_used_phone:jake').length > 0, 25000));
    assert.deepEqual(evs('npc_used_phone:jake')[0].data, { npcId: 'jake', need: 'social_media', playerNearby: true, playerDistance: 40 });
    assert.equal(evs('npc_left_post:').length, 0);
    assert.equal(evs('npc_used:').length, 0);
    assert.equal(w.calls.moves.length, movesBefore, 'never moved');
    const after = sys.getState('jake');
    assert.equal(after.atPost, true);
    assert.equal(after.distracted, false);
    assert.ok(after.levels.social_media >= 95, 'socialUse default restores 60');
});

test('the phone use lasts socialUse.useSeconds (default 20) and restores socialUse.restores', () => {
    const { sys, evs } = socialWorld({ rec: jake({ socialUse: { useSeconds: 8, restores: 30 } }) });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => sys.getState('jake').job?.kind === 'self', 30000));
    const t0 = sys.getState('jake').clockMs;
    const lvl = sys.getState('jake').levels.social_media;
    assert.ok(stepUntil(sys, () => evs('npc_used_phone:jake').length > 0, 20000));
    const t1 = sys.getState('jake').clockMs;
    assert.ok(t1 - t0 >= 7750 && t1 - t0 <= 8500, `took ${t1 - t0} ms`);
    assert.ok(Math.abs(sys.getState('jake').levels.social_media - (lvl + 30)) < 1.5);
});

test('candidate order: the allowed own PC first, at its post, with socialUse time; npc_used met', () => {
    const { sys, evs, log } = socialWorld({ objs: objects({ blocked: false, tablet: true }), rec: jake({ socialUse: { useSeconds: 7 } }) });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_used:jake_pc').length > 0, 40000));
    const u = evs('npc_used:jake_pc')[0].data;
    assert.equal(u.need, 'social_media');
    assert.equal(u.met, true);
    assert.equal(evs('npc_used_phone:').length, 0);
    assert.equal(evs('npc_left_post:').length, 0, 'an at-post use');
    assert.ok(log('used', 'jake')[0].level >= 95, 'socialUse restores 60, not the PC affordance 10');
});

test('candidate order: a non-desk source before the phone when the own PC blocks it; never another desk', () => {
    const { sys, evs } = socialWorld({ objs: objects({ tablet: true, otherDesk: true }) });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_used:').length > 0, 40000));
    assert.equal(evs('npc_used:')[0].name, 'npc_used:tablet');
    assert.equal(evs('npc_used_phone:').length, 0);
    assert.equal(evs('npc_used:lena_pc').length, 0);
});

test('candidate order: the phone when nothing else; a blocked PC with a phone never fails', () => {
    const { sys, evs, reports } = socialWorld();
    sys.registerAll();
    sys.step(180000);
    assert.ok(evs('npc_used_phone:jake').length >= 2);
    assert.equal(evs('npc_use_failed:').length, 0);
    assert.equal(evs('npc_used:').length, 0);
    assert.deepEqual(reports, []);
});

test('a blocked PC with no phone: the attempt fails with social_blocked, the line, a park and a report', () => {
    const { sys, evs, reports } = socialWorld({ rec: jake({ phone: false }) });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:jake').length > 0, 40000));
    assert.deepEqual(evs('npc_use_failed:jake')[0].data.missing, [{ id: 'jake_pc', why: 'social_blocked' }]);
    assert.equal(sys.getState('jake').talking.line, 'Blocked. Of course.');
    assert.deepEqual(sys.getState('jake').parked.map(p => [p.need, p.reason]), [['social_media', 'failed']]);
    assert.deepEqual(reports, [{ npcId: 'jake', event: 'fail', need: 'social_media', objectId: 'jake_pc', missing: [{ id: 'jake_pc', why: 'social_blocked' }] }]);
    assert.equal(evs('npc_used_phone:').length, 0);
});

test('a blocked PC with no phone still prefers a non-desk source', () => {
    const { sys, evs } = socialWorld({ rec: jake({ phone: false }), objs: objects({ tablet: true }) });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_used:tablet').length > 0, 40000));
    assert.equal(evs('npc_use_failed:').length, 0);
});

test('own PC switched off: an NPC with a phone takes its phone (no park, no report, no kick)', () => {
    const { sys, evs, reports } = socialWorld({ objs: objects({ blocked: false }), globals: { jake_pc_off: true } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_used_phone:jake').length > 0, 40000));
    assert.equal(evs('npc_need_parked:').length, 0);
    assert.deepEqual(reports, []);
});

test('own PC switched off with "phone": false: parks off, counted, with its line', () => {
    const chatter = { ...CHATTER, station_fail: ['This PC is useless.'] };
    const { sys, evs, reports, w } = socialWorld({ rec: jake({ phone: false }), objs: objects({ blocked: false }), globals: { jake_pc_off: true } });
    w.world.chatterConfig = () => chatter;
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_need_parked:jake').length > 0, 40000));
    const park = evs('npc_need_parked:jake')[0].data;
    assert.equal(park.reason, 'off');
    assert.equal(park.targetId, 'jake_pc');
    assert.deepEqual(reports.map(r => [r.event, r.need, r.missing]), [['fail', 'social_media', [{ id: 'jake_pc', why: 'off' }]]]);
    assert.equal(sys.getState('jake').talking.line, 'This PC is useless.');
});

test('a phone use on the walk home stops the walk, then walks on', () => {
    const rec = jake({ needs: { social_media: { decayPerMin: 60, urgentAt: 40, initial: 100, jitterPct: 0 } } });
    const { sys, w, evs } = socialWorld({ rec });
    w.world.moveTo = function (id, x, y, speed, opts) { w.calls.moves.push({ id, x, y, yieldToPlayer: opts.yieldToPlayer }); };
    w.pos.jake = { x: 600, y: 600, roomId: 'office' };
    sys.registerAll();
    sys.step(250);
    const s = sys.states.get('jake');
    s.atPost = false;
    sys._goHome(s);   // on its way back from somewhere
    sys.step(250);
    assert.equal(sys.getState('jake').mode, 'returning');
    s.levels.social_media = 30;
    s.urgentFlag.social_media = false;
    sys.step(500);
    assert.equal(sys.getState('jake').job?.kind, 'self');
    assert.ok(w.calls.cancels.includes('jake'), 'the walk stopped');
    const moves = w.calls.moves.length;
    assert.ok(stepUntil(sys, () => evs('npc_used_phone:jake').length > 0, 25000));
    assert.equal(sys.getState('jake').mode, 'returning');
    assert.ok(w.calls.moves.length > moves, 'walks on home');
    assert.equal(evs('npc_left_post:').length, 0);
});

test('a conversation freezes a phone use; a knock-out aborts it', () => {
    const { sys, w, evs } = socialWorld();
    sys.registerAll();
    assert.ok(stepUntil(sys, () => sys.getState('jake').job?.kind === 'self', 30000));
    sys.step(5000);
    w.setChat('jake');
    sys.step(30000);
    assert.equal(sys.getState('jake').mode, 'frozen');
    assert.equal(evs('npc_used_phone:').length, 0, 'frozen: not finished');
    w.setChat(null);
    sys.step(250);
    assert.equal(sys.getState('jake').job?.kind, 'self', 'resumes the same use');
    assert.ok(stepUntil(sys, () => evs('npc_used_phone:jake').length > 0, 16500));
    // Knock-out mid-use
    assert.ok(stepUntil(sys, () => sys.getState('jake').job?.kind === 'self', 60000));
    w.world.npcStatus = () => ({ ko: true });
    sys.step(250);
    assert.equal(sys.getState('jake').job, null);
    assert.equal(sys.getState('jake').distracted, false);
    assert.equal(evs('npc_used_phone:').length, 1);
});

test('an ease after a counted fail goes out for a phone use with a null object', () => {
    const { sys, evs, reports } = socialWorld();
    sys.registerAll();
    const s = sys.states.get('jake');
    s.failSent.social_media = true;
    assert.ok(stepUntil(sys, () => evs('npc_used_phone:jake').length > 0, 40000));
    assert.deepEqual(reports, [{ npcId: 'jake', event: 'ease', need: 'social_media', objectId: null }]);
});

test('seating keeps a phone user at its post seated; the icon is npc-social', async () => {
    const ns = { npcId: 'jake', atPost: true, mode: 'job', job: { kind: 'self', need: 'social_media', phase: 'using', targetId: null } };
    globalThis.window = globalThis.window || {};
    const { needsStop } = await import('../../public/break_escape/js/systems/seating.js');
    const prev = window.npcManager;
    window.npcManager = { getNPC: () => ({ needsHome: 'jake_pc' }) };
    try {
        assert.deepEqual(needsStop(ns), { key: 'at:jake_pc', targetId: 'jake_pc', post: true });
    } finally { window.npcManager = prev; }
    assert.equal(pickIconEntry(ns.job, {}, null).key, 'social');
    assert.equal(pickIconEntry({ kind: 'use', need: 'social_media', targetId: 'jake_pc' }, {}, { id: 'jake_pc', satisfies: 'work' }).key, 'social');
});

test('the existing social need (the cooler) is untouched: not judged, no phone', () => {
    const rec = { id: 'amy', needsHome: 'amy_pc', needs: { social: { decayPerMin: 60, urgentAt: 40, initial: 45, jitterPct: 0 } } };
    const npcs = { amy: { pos: { x: 100, y: 100 }, rec } };
    const { sys, evs } = workWorld({ npcs, objects: [{ id: 'amy_pc', x: 100, y: 68, desk: true, affordance: { satisfies: 'work' } },
        { id: 'cooler', x: 300, y: 300, affordance: { satisfies: 'social', restores: 50, useSeconds: 5 } }] });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_used:cooler').length > 0, 40000));
    assert.equal(evs('npc_used_phone:').length, 0);
    assert.equal(sys.getState('amy').judged.social_media, false);
});

// Review C R1 M2 and m3: the real adapter (createEngineWorld) over a stub window. An own
// workstation with no affordance is listed for an NPC with a social_media need; a PC whose policy
// blocks social media is described socialBlocked, and the adapter's verdict reads it.
function engineObjects({ affordance = null, policy = 'lax', needs = { social_media: {} } } = {}) {
    const rec = { id: 'jake', needsHome: 'jake_pc', needs };
    const sd = { id: 'jake_pc', type: 'pc', workstation: true, policy, ...(affordance ? { affordance } : {}) };
    const win = {
        rooms: { office: { objects: { jake_pc: { scenarioData: sd, x: 100, y: 68 }, plant: { scenarioData: { id: 'plant', type: 'plant' }, x: 10, y: 10 } } } },
        npcManager: { npcs: new Map([['jake', rec]]), getNPC: (id) => (id === 'jake' ? rec : null) },
        pcPolicy: { effectivePolicy: (d) => ({ social: d.policy === 'no_social' ? 'blocked' : 'allowed' }) },
        npcWork,
        gameState: { globalVariables: {} },
        gameScenario: {}
    };
    const prev = globalThis.window;
    globalThis.window = win;
    try {
        const w = createEngineWorld();
        const list = w.listObjects();
        const verdict = list[0] ? w.useVerdict('jake', 'social_media', list[0]) : null;
        return { list: list.map(({ _sprite, ...o }) => o), one: w.getObject('jake_pc'), verdict };
    } finally { globalThis.window = prev; }
}

test('review C R1 M2: the adapter lists an own workstation with no affordance for a social_media NPC, and only then', () => {
    const { list, one } = engineObjects();
    assert.deepEqual(list.map((o) => o.id), ['jake_pc'], 'the plant (no affordance, no desk) is still skipped');
    assert.equal(list[0].desk, true);
    assert.deepEqual(list[0].affordance, {});
    assert.deepEqual(one.affordance, {}, 'getObject agrees (the dead-station rule reads it)');
    assert.deepEqual(engineObjects({ needs: { work: {} } }).list, [], 'no social_media need: not listed');
});

test('review C R1 M2: an NPC with "phone": false and an own PC with no affordance uses that PC for social media', () => {
    const { list } = engineObjects();
    const { sys, evs } = socialWorld({ rec: jake({ phone: false }), objs: list });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_used:jake_pc').length > 0, 60000), 'used its own PC');
    const ev = evs('npc_used:jake_pc')[0].data;
    assert.equal(ev.need, 'social_media');
    assert.equal(ev.met, true);
    assert.equal(evs('npc_used_phone:').length, 0);
});

test('review C R1 m3: the adapter marks a no-social PC socialBlocked and its verdict refuses with social_blocked', () => {
    const blocked = engineObjects({ policy: 'no_social', affordance: { satisfies: 'work' } });
    assert.equal(blocked.list[0].socialBlocked, true);
    assert.deepEqual(blocked.verdict.missing.map((m) => m.why), ['social_blocked']);
    assert.equal(blocked.verdict.met, false);
    const lax = engineObjects({ affordance: { satisfies: 'work' } });
    assert.equal(lax.list[0].socialBlocked, undefined);
    assert.equal(lax.verdict.met, true);
});
