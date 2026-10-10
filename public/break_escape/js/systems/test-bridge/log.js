/**
 * test-bridge/log.js — drainable event log.
 *
 * Two sources feed one ring buffer:
 *   1. Actions the bridge attempted, with their outcome.
 *   2. Events the game emitted, captured by wrapping eventDispatcher.emit.
 *
 * The wrap is transparent — it calls through to the original emit and never
 * alters arguments or return value, so instrumenting cannot change behaviour
 * under test. Drain it after a failing step to see what the game actually did.
 */

import { safeJson } from './wait.js';

const MAX_ENTRIES = 500;
let buffer = [];
let seq = 0;
let installed = false;

function push(entry) {
    buffer.push({ seq: ++seq, t: Math.round(performance.now()), ...entry });
    if (buffer.length > MAX_ENTRIES) buffer = buffer.slice(-MAX_ENTRIES);
}

export function logAction(action, detail, result) {
    push({ kind: 'action', action, detail: safeJson(detail), result: safeJson(result) });
}

export function logNote(message, detail) {
    push({ kind: 'note', message, detail: safeJson(detail) });
}

/**
 * Events worth recording. The dispatcher carries a lot of high-frequency
 * chatter (per-tick NPC updates); recording all of it would drown the signal,
 * so keep the ones that mark real state transitions.
 */
const INTERESTING = [
    /^objective_/, /^task_/, /^aim_/,
    /^minigame_/, /^conversation_/, /^npc_/,
    /^item_/, /^door_/, /^room_/,
    /^global_variable_changed:/,
    /^player_/, /^game_/, /^mission_/
];

export function installEventCapture() {
    if (installed) return false;
    const dispatcher = window.eventDispatcher;
    if (!dispatcher || typeof dispatcher.emit !== 'function') return false;

    const originalEmit = dispatcher.emit.bind(dispatcher);
    dispatcher.emit = function (eventType, data) {
        if (INTERESTING.some(re => re.test(eventType))) {
            push({ kind: 'event', event: eventType, data: safeJson(data) });
        }
        return originalEmit(eventType, data);
    };
    installed = true;
    return true;
}

/** Return the buffered entries and clear the buffer. */
export function drain() {
    const out = buffer;
    buffer = [];
    return out;
}

/** Read without clearing. */
export function peek(n = 50) {
    return buffer.slice(-n);
}

export function clear() {
    buffer = [];
}

/**
 * The current sequence counter, for callers that want to check "did anything
 * happen after this point" without draining (and so destroying) the log the
 * caller can still inspect afterward.
 */
export function currentSeq() {
    return seq;
}

/**
 * Game-emitted (`kind: 'event'`) entries recorded after `fromSeq`, without
 * clearing the buffer. Used to confirm an action actually had an effect
 * (something opened, something the game emits an event for) rather than
 * trusting a click's own "it landed" status — see `interact()`'s use of this
 * in index.js.
 */
export function eventsSince(fromSeq) {
    return buffer.filter(e => e.kind === 'event' && e.seq > fromSeq);
}
