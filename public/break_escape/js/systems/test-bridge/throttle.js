/**
 * Headless frame-rate throttle for the test bridge (window.__test.throttleFps /
 * unthrottleFps).
 *
 * Why this exists: in Phaser 3.60.0 the main loop (Phaser.Core.TimeStep) works
 * out `_limitRate` once, in its constructor, and picks `step` or `stepLimitFPS`
 * once, in start(). Setting only `fpsLimit` and `hasFpsLimit` afterwards changes
 * two fields nobody reads and the game keeps running at the browser's full
 * rate. A working throttle sets `_limitRate` as well, then sleep()s and wake()s
 * the loop so the callback is re-bound to stepLimitFPS.
 *
 * `loop.actualFps` cannot be used to check it: stepLimitFPS counts every
 * requestAnimationFrame tick, skipped or not, so actualFps keeps reading about
 * 60. The helper counts the game's own 'step' events instead.
 *
 * Physics fixed steps must stay on (they are the default). With them off,
 * bodies tunnel through 8 px walls at low frame rates, so the helper refuses.
 */

const DEFAULT_WINDOW_MS = 600;

function defaultSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Game 'step' events per second over windowMs. */
async function stepsPerSecond(phaserGame, windowMs, sleep, now) {
    let count = 0;
    const onStep = () => { count++; };
    phaserGame.events.on('step', onStep);
    const t0 = now();
    try {
        await sleep(windowMs);
    } finally {
        phaserGame.events.off('step', onStep);
    }
    const seconds = Math.max(0.001, (now() - t0) / 1000);
    return Math.round((count / seconds) * 10) / 10;
}

function applyLimit(loop, fps) {
    loop.fpsLimit = fps;
    loop.hasFpsLimit = fps > 0;
    loop._limitRate = fps > 0 ? 1000 / fps : 0;
    // Re-bind the RAF callback (step <-> stepLimitFPS); seamless wake keeps the clock.
    loop.sleep();
    loop.wake(true);
}

/**
 * @param {object} deps
 *   game   Phaser.Game (window.game.game)
 *   scene  the Scene (window.game), for physics.world.fixedStep
 *   sleep, now  injectable for tests
 */
export async function throttleFps(fps, deps, opts = {}) {
    const { game: phaserGame, scene } = deps;
    const sleep = deps.sleep || defaultSleep;
    const now = deps.now || (() => Date.now());
    const windowMs = opts.windowMs || DEFAULT_WINDOW_MS;
    const target = Number(fps);
    if (!(target >= 1 && target <= 240)) {
        return { ok: false, reason: 'bad-fps', fps };
    }
    const loop = phaserGame && phaserGame.loop;
    if (!loop || typeof loop.sleep !== 'function' || typeof loop.wake !== 'function') {
        return { ok: false, reason: 'no-loop' };
    }
    const fixedStep = scene && scene.physics && scene.physics.world
        ? scene.physics.world.fixedStep : undefined;
    if (fixedStep !== true) {
        return { ok: false, reason: 'fixed-step-off', fixedStep };
    }
    const prior = { fpsLimit: loop.fpsLimit, hasFpsLimit: loop.hasFpsLimit, limitRate: loop._limitRate };
    if (!phaserGame.__throttlePrior) phaserGame.__throttlePrior = prior;
    const before = await stepsPerSecond(phaserGame, windowMs, sleep, now);
    let after;
    try {
        applyLimit(loop, target);
        after = await stepsPerSecond(phaserGame, windowMs, sleep, now);
    } catch (err) {
        // The limit may be half applied: say so and leave the loop recoverable. The prior
        // values are kept in __throttlePrior, so unthrottleFps restores them.
        return {
            ok: false, reason: 'throttle-failed', fps: target,
            error: String(err && err.message || err), recoverWith: 'unthrottleFps'
        };
    }
    return {
        ok: true, fps: target, before, after,
        rafFps: Number.isFinite(loop.actualFps) ? Math.round(loop.actualFps * 10) / 10 : null,
        limitRate: loop._limitRate, fixedStep
    };
}

/** Put the loop back to unthrottled. Safe to call when never throttled. */
export async function unthrottleFps(deps, opts = {}) {
    const { game: phaserGame } = deps;
    const sleep = deps.sleep || defaultSleep;
    const now = deps.now || (() => Date.now());
    const windowMs = opts.windowMs || DEFAULT_WINDOW_MS;
    const loop = phaserGame && phaserGame.loop;
    if (!loop || typeof loop.sleep !== 'function') return { ok: false, reason: 'no-loop' };
    const before = await stepsPerSecond(phaserGame, windowMs, sleep, now);
    const prior = phaserGame.__throttlePrior;
    applyLimit(loop, prior && prior.hasFpsLimit ? prior.fpsLimit : 0);
    delete phaserGame.__throttlePrior;
    const after = await stepsPerSecond(phaserGame, windowMs, sleep, now);
    return { ok: true, before, after, limitRate: loop._limitRate };
}
