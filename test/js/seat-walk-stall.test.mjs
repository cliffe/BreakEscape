// An NPC seat walk (stand-up step, mount, work-spot walk) that is blocked (the player standing
// beside the seat) waits still and idle, retries, and only then counts as stuck; a block that
// clears lets the walk finish. The fake sprite moves by velocity times tick time, so "held
// still" is really tested. Fake sprite only; no browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
const { npcWalkTick, resetWalk } = await import('../../public/break_escape/js/systems/seating.js');

function npc(x, y) {
    const sprite = {
        x, y, scaleX: 1, scaleY: 1, displayOriginX: 0, displayOriginY: 0, scene: { time: { now: 1000 } },
        body: { offset: { x: 0, y: 0 }, width: 0, height: 0, velocity: { x: 0, y: 0 },
            setVelocity(vx, vy) { this.velocity.x = vx; this.velocity.y = vy; }, reset(nx, ny) { sprite.x = nx; sprite.y = ny; },
            position: { copy() {} }, prev: { copy() {} }, prevFrame: { copy() {} } }
    };
    const anims = [];
    return { sprite, anims, direction: 'up', isMoving: false, playAnimation: (a) => anims.push(a), updateDepth() {} };
}
const fresh = () => ({ ticks: 0, still: 0, wait: 0, hist: [], t: 1000 });

// Run ticks of `ms`; `speedAt(i)` is the share of the commanded velocity that physics lets through.
function run(b, m, target, { ms = 50, speedAt = () => 1, max = 60 } = {}) {
    const rows = [];
    let r = 'moving';
    for (let i = 0; i < max && r === 'moving'; i++) {
        b.sprite.scene.time.now += ms;
        r = npcWalkTick(b, m, target);
        const v = b.sprite.body.velocity, k = speedAt(i);
        rows.push({ i, r, vy: v.y, y: b.sprite.y, anim: b.anims[b.anims.length - 1], moving: b.isMoving });
        b.sprite.x += v.x * k * ms / 1000; b.sprite.y += v.y * k * ms / 1000;
    }
    return { r, rows, ticks: rows.length };
}
const target = { x: 100, y: 221 };

test('a walk creeping at 0.58 px per tick is held still, retried, then stuck', () => {
    const b = npc(100, 233), m = fresh();
    const { r, rows } = run(b, m, target, { speedAt: () => 0.58 / 3.5 });
    assert.equal(r, 'stuck');
    assert.ok(rows.length <= 40);
    assert.equal(b.sprite.body.velocity.y, 0);
    assert.equal(b.anims[b.anims.length - 1], 'idle', 'no walk animation while blocked');
});

test('a stall is a real wait: zero velocity and idle for several ticks, y does not move', () => {
    const b = npc(100, 233), m = fresh();
    const { rows } = run(b, m, target, { speedAt: () => 0.2 });
    const firstStall = rows.findIndex((x) => x.vy === 0);
    assert.ok(firstStall >= 0);
    const held = rows.slice(firstStall).filter((x) => x.vy === 0 && x.r === 'moving');
    assert.ok(held.length >= 6, `held ${held.length} ticks`);
    const ys = held.map((x) => x.y);
    assert.ok(Math.max(...ys) - Math.min(...ys) < 0.01, 'position held still while waiting');
    assert.ok(held.every((x) => x.moving === false && x.anim === 'idle'));
    // no -70 / 0 alternation: once held, velocity stays 0 for the whole wait
    const seq = rows.slice(firstStall, firstStall + held.length).map((x) => x.vy);
    assert.ok(seq.every((v) => v === 0));
});

test('a short block that clears resumes the walk and reaches the target', () => {
    for (const blockedTicks of [2, 6, 9]) {
        const b = npc(100, 233), m = fresh();
        const { r } = run(b, m, target, { speedAt: (i) => (i < blockedTicks ? 0 : 1) });
        assert.equal(r, 'arrived', `blocked ${blockedTicks} ticks`);
        assert.equal(b.sprite.y, 221);
    }
});

test('a long block ends stuck after the retries, within the move cap, held still', () => {
    const b = npc(100, 233), m = fresh();
    const { r, rows, ticks } = run(b, m, target, { speedAt: () => 0 });
    assert.equal(r, 'stuck');
    assert.ok(ticks <= 40, `stuck after ${ticks}`);
    assert.ok(rows.filter((x) => x.vy === 0).length >= 8, 'waited between tries');
    assert.equal(b.sprite.y, 233);
});

test('a walk making full progress keeps moving and arrives', () => {
    const b = npc(100, 233), m = fresh();
    const { r, rows } = run(b, m, target);
    assert.equal(r, 'arrived');
    assert.ok(rows.every((x) => x.vy !== 0 || x.r === 'arrived'));
});

test('67 ms and 100 ms ticks arrive without overshoot or oscillation', () => {
    for (const ms of [66.7, 100]) {
        for (const dist of [3, 12, 60]) {
            const b = npc(100, 221 + dist), m = fresh();
            const { r, rows } = run(b, m, target, { ms });
            assert.equal(r, 'arrived', `${ms} ms, ${dist} px`);
            assert.ok(rows.every((x) => x.y >= 221 - 0.01), 'no overshoot');
        }
    }
});

test('a 3 px step (under the progress window) arrives', () => {
    const b = npc(100, 224), m = fresh();
    assert.equal(run(b, m, target).r, 'arrived');
});

test('a 2.5 px step at 100 ms ticks arrives', () => {
    const b = npc(100, 223.5), m = fresh();
    assert.equal(run(b, m, target, { ms: 100 }).r, 'arrived');
});

test('the window resets between route legs: a fresh m does not inherit a stall', () => {
    const b = npc(100, 233), m = fresh();
    assert.equal(run(b, m, target).r, 'arrived');
    // next leg: resetWalk-equivalent state, blocked for a short while then free
    m.wait = 5; m.hist = [9, 8, 7]; m.pf = { x: 1, y: 1 };
    resetWalk(m);
    assert.deepEqual([m.ticks, m.still, m.wait, m.hist.length, m.pf, m.t], [0, 0, 0, 0, undefined, undefined]);
    b.sprite.y = 233;
    assert.equal(run(b, m, target, { speedAt: (i) => (i < 4 ? 0 : 1) }).r, 'arrived');
});

test('a blocked probe shows no walk animation after the first tick; a free walk animates from tick one', () => {
    const b = npc(100, 233), m = fresh();
    const { rows } = run(b, m, target, { speedAt: () => 0 });
    // rows[i].anim is the last animation played; count ticks after the first where a walk was (re)played while the feet did not move
    const walkPlays = b.anims.filter((a) => a === 'walk').length;
    assert.ok(walkPlays <= 2, `walk played ${walkPlays} times while blocked`);
    assert.ok(rows.slice(1).every((x) => x.moving === false || x.r === 'stuck'), 'not flagged moving after the first tick');
    // free walk: walk animation from the very first tick
    const b2 = npc(100, 233), m2 = fresh();
    npcWalkTick(b2, m2, target);
    assert.equal(b2.anims[0], 'walk');
    assert.equal(b2.isMoving, true);
});

test('after a stall wait the retry probe starts idle and walks only once the feet move', () => {
    const b = npc(100, 233), m = fresh();
    const { r, rows } = run(b, m, target, { speedAt: (i) => (i < 14 ? 0 : 1) });
    assert.equal(r, 'arrived');
    const retry = rows.slice(13, 17);
    assert.equal(retry[0].moving, false, 'first retry tick idles');
    assert.ok(rows[rows.length - 2].moving, 'walk animation plays while actually moving');
});

test('a slide at 0.945 px per tick (above the stall floor) is not stalled and keeps animating', () => {
    const b = npc(100, 233), m = fresh();
    const { rows } = run(b, m, target, { speedAt: () => 0.27, max: 9 });
    assert.ok(rows.every((x) => x.r === 'moving'), 'not stalled');
    assert.ok(rows.every((x) => x.moving === true && x.anim === 'walk'), 'walk animation while moving');
    assert.ok(!b.anims.includes('idle'));
});

test('resetWalk clears the clock: the first tick after a reset uses the 50 ms step, not the stale gap', () => {
    const b = npc(100, 224), m = fresh();
    b.sprite.scene.time.now += 50;
    npcWalkTick(b, m, target);
    b.sprite.scene.time.now += 200;
    resetWalk(m);
    npcWalkTick(b, m, target);
    assert.ok(Math.abs(b.sprite.body.velocity.y + 60) < 1e-6, `vy ${b.sprite.body.velocity.y}`);
});

test('a long real gap (1 s) with a short distance commands at most d / gap, no overshoot', () => {
    const b = npc(100, 224), m = fresh();
    b.sprite.scene.time.now += 50;
    npcWalkTick(b, m, target);
    b.sprite.scene.time.now += 1000;
    assert.equal(npcWalkTick(b, m, target), 'moving');
    assert.ok(Math.abs(b.sprite.body.velocity.y) <= 3 / 1.0 + 1e-6, `vy ${b.sprite.body.velocity.y}`);
    assert.ok(Math.abs(b.sprite.body.velocity.y) * 1.0 <= 3 + 1e-6, 'a 1 s frame cannot pass the target');
});
