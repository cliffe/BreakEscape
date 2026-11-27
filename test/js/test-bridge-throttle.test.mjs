// window.__test.throttleFps: a fake Phaser 3.60 loop that behaves like the real
// TimeStep (the limit only bites after _limitRate is set AND sleep()/wake() rebinds).
import test from 'node:test';
import assert from 'node:assert/strict';
import { throttleFps, unthrottleFps } from '../../public/break_escape/js/systems/test-bridge/throttle.js';

function makeWorld({ fixedStep = true } = {}) {
    let clock = 0;
    const listeners = new Set();
    const events = { on: (n, f) => n === 'step' && listeners.add(f), off: (n, f) => n === 'step' && listeners.delete(f) };
    const loop = {
        fpsLimit: 0, hasFpsLimit: false, _limitRate: 0, actualFps: 60,
        bound: 'step', delta: 0,
        sleep() { this.bound = 'asleep'; },
        wake() { this.bound = this.hasFpsLimit ? 'stepLimitFPS' : 'step'; }
    };
    const game = { loop, events };
    const scene = { physics: { world: { fixedStep } } };
    // 60 RAF ticks a second, 16.667 ms each, like headless Chromium.
    const sleep = async (ms) => {
        const ticks = Math.round(ms / (1000 / 60));
        for (let i = 0; i < ticks; i++) {
            clock += 1000 / 60;
            if (loop.bound === 'step') listeners.forEach((f) => f());
            else if (loop.bound === 'stepLimitFPS') {
                loop.delta += 1000 / 60;
                if (loop.delta >= loop._limitRate - 1e-9) { listeners.forEach((f) => f()); loop.delta = 0; }
            }
        }
    };
    return { game, scene, sleep, now: () => clock, loop };
}

test('the old recipe (fpsLimit + hasFpsLimit only) changes nothing in the fake loop', async () => {
    const w = makeWorld();
    w.loop.fpsLimit = 20; w.loop.hasFpsLimit = true;
    await w.sleep(10);
    let n = 0; w.game.events.on('step', () => n++);
    await w.sleep(1000);
    assert.ok(n >= 59, `old recipe still steps ${n}/s`);
});

test('throttleFps drops steps per second to about the target and reports before/after', async () => {
    const w = makeWorld();
    const r = await throttleFps(20, w);
    assert.equal(r.ok, true);
    assert.ok(r.before >= 55, `before ${r.before}`);
    assert.ok(r.after >= 16 && r.after <= 22, `after ${r.after}`);
    assert.equal(w.loop.fpsLimit, 20);
    assert.equal(w.loop.hasFpsLimit, true);
    assert.equal(w.loop._limitRate, 50);
    assert.equal(w.loop.bound, 'stepLimitFPS');
    assert.equal(r.fixedStep, true);
});

test('unthrottleFps restores the full rate and clears the limit', async () => {
    const w = makeWorld();
    await throttleFps(20, w);
    const r = await unthrottleFps(w);
    assert.equal(r.ok, true);
    assert.ok(r.before <= 22, `before ${r.before}`);
    assert.ok(r.after >= 55, `after ${r.after}`);
    assert.equal(w.loop.hasFpsLimit, false);
    assert.equal(w.loop._limitRate, 0);
    assert.equal(w.loop.bound, 'step');
});

test('throttleFps refuses when physics fixed steps are off, and touches nothing', async () => {
    const w = makeWorld({ fixedStep: false });
    const r = await throttleFps(20, w);
    assert.deepEqual([r.ok, r.reason], [false, 'fixed-step-off']);
    assert.equal(w.loop.hasFpsLimit, false);
    assert.equal(w.loop.bound, 'step');
});

test('throttleFps rejects a silly rate and a missing loop', async () => {
    const w = makeWorld();
    assert.equal((await throttleFps(0, w)).reason, 'bad-fps');
    assert.equal((await throttleFps('x', w)).reason, 'bad-fps');
    assert.equal((await throttleFps(20, { game: {}, scene: w.scene })).reason, 'no-loop');
});

test('throttling twice keeps the first prior value for unthrottle', async () => {
    const w = makeWorld();
    await throttleFps(20, w);
    await throttleFps(30, w);
    assert.equal(w.loop._limitRate, 1000 / 30);
    await unthrottleFps(w);
    assert.equal(w.loop.hasFpsLimit, false);
});

test('R4 m3: sampling that throws after the limit is applied replies with an error and unthrottle recovers', async () => {
    const w = makeWorld();
    let calls = 0;
    const flaky = async (ms) => { if (++calls === 2) throw new Error('boom'); return w.sleep(ms); };
    const r = await throttleFps(20, { ...w, sleep: flaky });
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'throttle-failed');
    assert.match(r.error, /boom/);
    const u = await unthrottleFps(w);
    assert.equal(u.ok, true);
    assert.equal(w.loop.hasFpsLimit, false);
    assert.equal(w.loop._limitRate, 0);
});

test('R4 n1: a loop without actualFps reports rafFps null, not NaN', async () => {
    const w = makeWorld();
    delete w.loop.actualFps;
    const r = await throttleFps(20, w);
    assert.equal(r.rafFps, null);
});
