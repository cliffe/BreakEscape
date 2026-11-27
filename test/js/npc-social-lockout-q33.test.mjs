// User decision q33 (2026-11-12): a lockout (access slice 9.2 L) stops every use of that PC,
// social media included. In the needs core a flagged station is passed over for social media
// (to a non-desk source, then the phone), and with no phone it is the attempt that fails with
// locked_out. The report queue checks an owner with a social_media need; the feed names the
// use's source so the server can refuse a post from a locked-out PC.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workWorld } from './fixtures/needs-work-world.mjs';
import npcWork from '../../public/break_escape/js/systems/npc-work.js';
import { shouldCheckLockout } from '../../public/break_escape/js/systems/npc-reports.js';
import { SocialFeed, installSocialFeed } from '../../public/break_escape/js/systems/social-feed.js';

const CHATTER = { social_blocked: ['Blocked. Of course.'], station_fail: ['This PC is useless.'] };
const checkAnswer = (lockedOut) => [{ npcId: 'lena', forEvent: 'check', forObject: 'lena_pc', lockedOut }];

function stepUntil(sys, pred, maxMs = 120000) {
    for (let t = 0; t < maxMs; t += 250) { if (pred()) return true; sys.step(250); }
    return pred();
}

function lena(extra = {}) {
    return {
        id: 'lena', needsHome: 'lena_pc', needsDeferMin: 0.5,
        needs: { social_media: { decayPerMin: 60, urgentAt: 40, initial: 45, jitterPct: 0 } },
        ...extra
    };
}

function objects({ tablet = false } = {}) {
    const out = [{ id: 'lena_pc', x: 100, y: 68, desk: true, socialBlocked: false,
        affordance: { satisfies: 'work', restores: 10, useSeconds: 5 } }];
    if (tablet) out.push({ id: 'tablet', x: 300, y: 300, affordance: { satisfies: 'social_media', restores: 50, useSeconds: 6 } });
    return out;
}

/** The needs work world with the live adapter's verdict (its station never says lockedOut: the core adds it). */
function socialWorld({ rec = lena(), objs = objects() } = {}) {
    const npcs = { lena: { pos: { x: 100, y: 100 }, rec } };
    const out = workWorld({ npcs, objects: objs, chatter: CHATTER, seed: 'q33' });
    out.w.world.useVerdict = (npcId, need, obj) => {
        const station = obj && obj.id === rec.needsHome ? { id: obj.id, lockedOut: false, socialBlocked: !!obj.socialBlocked } : null;
        return npcWork.useVerdict(rec.work, need, station, out.g);
    };
    out.w.world.playerProximity = () => ({ nearby: true, distance: 40 });
    return out;
}

function flag(sys) {
    assert.equal(sys.lockCheckSent('lena', 'lena_pc'), true);
    sys.applyFrustration(checkAnswer(true));
    sys.step(250);
    assert.equal(sys.isLockedOut('lena', 'lena_pc'), true);
}

test('before a lockout the allowed own PC is used for social media (the base case)', () => {
    const { sys, evs } = socialWorld();
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_used:lena_pc').length > 0, 40000));
    assert.equal(evs('npc_used:lena_pc')[0].data.met, true);
    assert.equal(evs('npc_used_phone:').length, 0);
});

test('flagged locked out at the own PC, with a phone: the phone every time, never the PC, nothing counted', () => {
    const { sys, evs, reports } = socialWorld();
    sys.registerAll();
    flag(sys);
    sys.step(180000);
    assert.ok(evs('npc_used_phone:lena').length >= 2, 'falls back to her own phone (her own accounts)');
    assert.equal(evs('npc_used:lena_pc').length, 0, 'the locked PC is never used for social media');
    assert.equal(evs('npc_use_failed:').length, 0);
    assert.deepEqual(reports.filter(r => r.event === 'fail'), []);
});

test('flagged, with a non-desk source: that device before the phone', () => {
    const { sys, evs } = socialWorld({ objs: objects({ tablet: true }) });
    sys.registerAll();
    flag(sys);
    assert.ok(stepUntil(sys, () => evs('npc_used:').length > 0, 40000));
    assert.equal(evs('npc_used:')[0].name, 'npc_used:tablet');
    assert.equal(evs('npc_used:lena_pc').length, 0);
});

test('flagged with "phone": false and nothing else: the attempt at the PC fails with locked_out and counts', () => {
    const { sys, evs, reports, log } = socialWorld({ rec: lena({ phone: false }) });
    sys.registerAll();
    flag(sys);
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:lena').length > 0, 40000));
    assert.deepEqual(evs('npc_use_failed:lena')[0].data,
        { npcId: 'lena', objectId: 'lena_pc', need: 'social_media', missing: [{ id: 'lena_pc', why: 'locked_out' }], station: true });
    assert.equal(log('turned_back', 'lena')[0].grumble, 'station_fail');
    assert.deepEqual(reports.filter(r => r.event === 'fail'),
        [{ npcId: 'lena', event: 'fail', need: 'social_media', objectId: 'lena_pc', missing: [{ id: 'lena_pc', why: 'locked_out' }] }]);
    assert.equal(evs('npc_used:lena_pc').length, 0);
});

test('a use held at the PC by a check in flight: a true answer drops it unjudged, then the phone', () => {
    const { sys, evs, reports, log } = socialWorld();
    sys.registerAll();
    assert.equal(sys.lockCheckSent('lena', 'lena_pc'), true);
    assert.ok(stepUntil(sys, () => log('use_held', 'lena').length > 0, 40000), 'the first use waits for the answer');
    sys.applyFrustration(checkAnswer(true));
    assert.ok(stepUntil(sys, () => log('use_dropped_locked_out', 'lena').length > 0, 5000));
    assert.equal(evs('npc_used:lena_pc').length, 0, 'never met at the locked PC');
    assert.ok(stepUntil(sys, () => evs('npc_used_phone:lena').length > 0, 60000));
    assert.deepEqual(reports.filter(r => r.event === 'fail'), []);
});

test('shouldCheckLockout: an owner with a social_media need and no work plan is checked', () => {
    const base = { wasLocked: true, seen: true, pcId: 'lena_pc', policy: { maxAttempts: 3 }, flagged: false };
    assert.equal(shouldCheckLockout({ ...base, owner: { id: 'lena', needsHome: 'lena_pc', needs: { social_media: { decayPerMin: 60 } } } }), true);
    assert.equal(shouldCheckLockout({ ...base, owner: { id: 'lena', needsHome: 'lena_pc', needs: { hunger: { decayPerMin: 4 } } } }), false, 'neither need');
    assert.equal(shouldCheckLockout({ ...base, owner: { id: 'lena', needsHome: 'other_pc', needs: { social_media: {} } } }), false, 'not its station');
});

test('the feed names the use\'s source on every ask, and a refused answer is not asked again', async () => {
    const sent = [];
    const feed = new SocialFeed({
        send: (npcId, source) => { sent.push([npcId, source]); return Promise.resolve({ npcId, post: null, done: false, refused: true }); },
        hasFeed: () => true, mergeFact() {}, emit() {}, toast() {}, siteVisited: () => true, toastsOn: () => true,
        npcName: () => 'Lena', siteName: () => 'Friendface', later: (fn) => fn()
    });
    await feed.onUse('lena', 'lena_pc');
    await feed.onUse('lena', null);
    await feed.onUse('lena', { id: 'x' });
    assert.deepEqual(sent, [['lena', 'lena_pc'], ['lena', null], ['lena', null]]);
    assert.deepEqual(feed.revealed(), {});
});

test('installSocialFeed: npc_used sends its objectId, npc_used_phone sends null', async () => {
    const handlers = new Map();
    const sent = [];
    globalThis.window = {
        gameScenario: { social: { osint: { sites: [] } } },
        gameState: { globalVariables: {} },
        npcManager: { getNPC: (id) => ({ id, hasFeed: true }) },
        eventDispatcher: { on(name, cb) { handlers.set(name, cb); }, emit() {} }
    };
    const api = { feedPost: (id, objectId) => { sent.push([id, objectId]); return Promise.resolve({ npcId: id, post: null, done: false }); } };
    try {
        installSocialFeed(api, null);
        await handlers.get('npc_used:*')({ npcId: 'lena', objectId: 'tablet', need: 'social_media', met: true });
        await new Promise((r) => setTimeout(r, 0));
        await handlers.get('npc_used_phone:*')({ npcId: 'jake', need: 'social_media' });
        await new Promise((r) => setTimeout(r, 0));
        assert.deepEqual(sent, [['lena', 'tablet'], ['jake', null]]);
    } finally { delete globalThis.window; }
});
