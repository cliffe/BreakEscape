/**
 * test-bridge/wait.js — deterministic waiting.
 *
 * Everything here resolves off the game's own clock (requestAnimationFrame,
 * which advances in lockstep with Phaser's update loop) or off an event the
 * game emits through window.eventDispatcher. No fixed sleeps are used to
 * decide whether something happened — timeouts exist only as failure bounds.
 */

import { sleepFrames } from './input.js';

export const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Wait until `predicate()` returns truthy, re-evaluating once per rendered
 * frame. Resolves with { ok: true, value, elapsedMs } or, on timeout,
 * { ok: false, reason: 'timeout' } — it rejects nothing, so a test client
 * always gets a JSON verdict rather than an exception across the boundary.
 */
export async function waitUntil(predicate, { timeoutMs = DEFAULT_TIMEOUT_MS, label = 'condition' } = {}) {
    const started = performance.now();
    for (;;) {
        let value;
        try {
            value = predicate();
        } catch (err) {
            return { ok: false, reason: 'predicate-threw', label, error: String(err) };
        }
        if (value) {
            return { ok: true, label, value: value === true ? true : null, elapsedMs: Math.round(performance.now() - started) };
        }
        if (performance.now() - started > timeoutMs) {
            return { ok: false, reason: 'timeout', label, elapsedMs: Math.round(performance.now() - started) };
        }
        await sleepFrames(1);
    }
}

/**
 * Wait for a named event on the game's own dispatcher (the same channel NPC
 * handlers, objectives and minigames use). Resolves { ok, event, data }.
 */
export function waitForEvent(eventName, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    return new Promise(resolve => {
        const dispatcher = window.eventDispatcher;
        if (!dispatcher) {
            resolve({ ok: false, reason: 'no-dispatcher', event: eventName });
            return;
        }
        let done = false;
        const handler = (data) => {
            if (done) return;
            done = true;
            dispatcher.off?.(eventName, handler);
            clearTimeout(timer);
            resolve({ ok: true, event: eventName, data: safeJson(data) });
        };
        const timer = setTimeout(() => {
            if (done) return;
            done = true;
            dispatcher.off?.(eventName, handler);
            resolve({ ok: false, reason: 'timeout', event: eventName });
        }, timeoutMs);
        dispatcher.on(eventName, handler);
    });
}

/** Advance a fixed number of rendered frames — for settling animations. */
export async function waitFrames(n = 1) {
    await sleepFrames(n);
    return { ok: true, frames: n };
}

/**
 * Wait for the player to come to rest.
 *
 * Movement finishing is observable: click-to-move clears the path and the
 * physics body's velocity drops to zero. Require the body to be still for a
 * few consecutive frames so a momentary zero mid-path (a waypoint turn)
 * doesn't read as "arrived".
 */
export async function waitForMovementEnd({ timeoutMs = DEFAULT_TIMEOUT_MS, stillFrames = 6 } = {}) {
    let still = 0;
    const started = performance.now();
    // Walking into a collider leaves the player "moving" (velocity set, every
    // frame) without going anywhere, and the engine never gives up on its own.
    // Judged on velocity alone, that held moveTo for its whole 20s timeout
    // (measured: library furniture, Oct 2026). Track displacement too, and call
    // it stuck after STUCK_MS without moving a pixel.
    const STUCK_MS = 800;
    let anchor = null;
    // Give the click a few frames to actually start a path before judging.
    await sleepFrames(4);
    for (;;) {
        const p = window.player;
        if (!p) return { ok: false, reason: 'no-player' };
        const v = p.body?.velocity;
        const moving = p.isMoving || (v && (Math.abs(v.x) > 1 || Math.abs(v.y) > 1));
        still = moving ? 0 : still + 1;
        if (still >= stillFrames) {
            return { ok: true, x: Math.round(p.x), y: Math.round(p.y), elapsedMs: Math.round(performance.now() - started) };
        }
        const now = performance.now();
        if (!moving || !anchor || Math.hypot(p.x - anchor.x, p.y - anchor.y) >= 1) {
            anchor = { x: p.x, y: p.y, t: now };
        } else if (now - anchor.t > STUCK_MS) {
            const b = p.body?.blocked || {};
            return {
                ok: false, reason: 'stuck', x: Math.round(p.x), y: Math.round(p.y),
                blocked: ['up', 'down', 'left', 'right'].filter(k => b[k]),
                elapsedMs: Math.round(now - started)
            };
        }
        if (performance.now() - started > timeoutMs) {
            return { ok: false, reason: 'timeout', x: Math.round(p.x), y: Math.round(p.y) };
        }
        await sleepFrames(1);
    }
}

/** Wait until a minigame overlay is open (optionally a specific one). */
export function waitForMinigame(id = null, opts = {}) {
    return waitUntil(() => {
        const mg = window.__test?.getState?.()?.activeMinigame;
        return !!mg && (!id || mg.id === id);
    }, { ...opts, label: `minigame:${id || 'any'}` });
}

/** Wait until no minigame overlay is open. */
export function waitForMinigameClosed(opts = {}) {
    return waitUntil(() => !window.MinigameFramework?.currentMinigame,
        { ...opts, label: 'minigame-closed' });
}

/** Strip anything that will not survive structured cloning. */
export function safeJson(value, depth = 0) {
    if (value === null || value === undefined) return null;
    const t = typeof value;
    if (t === 'string' || t === 'number' || t === 'boolean') return value;
    if (t === 'function') return '[function]';
    if (depth > 3) return '[deep]';
    if (Array.isArray(value)) return value.slice(0, 20).map(v => safeJson(v, depth + 1));
    if (t === 'object') {
        // Phaser game objects must never cross the boundary — they are huge,
        // cyclic, and full of functions. Detect them by their telltale members
        // rather than by constructor name, which is minified/duck-typed here.
        const looksLikeGameObject =
            value.scene || value.texture || value.body ||
            typeof value.setVisible === 'function' ||
            typeof value.destroy === 'function' ||
            typeof value.setPosition === 'function';
        if (looksLikeGameObject) {
            // Keep the few identifying fields a test client actually wants.
            return {
                _gameObject: value.constructor?.name || 'unknown',
                objectId: typeof value.objectId === 'string' ? value.objectId : null,
                npcId: typeof value.npcId === 'string' ? value.npcId : null,
                name: typeof value.name === 'string' ? value.name : null
            };
        }
        const out = {};
        Object.keys(value).slice(0, 30).forEach(k => { out[k] = safeJson(value[k], depth + 1); });
        return out;
    }
    return String(value);
}
