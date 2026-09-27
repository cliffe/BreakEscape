/**
 * Lip-sync - text → viseme timeline for dialogue portraits
 *
 * Mirrors the plan PixelLab's /v2/lip-sync endpoint produces from a line of text, so a
 * `<key>_visemes.png` sheet (one mouth shape per column) can be driven locally without
 * an API call per line. Pure functions, no DOM or Phaser — unit tested by
 * test/js/lip-sync.test.mjs (run with `node test/js/lip-sync.test.mjs`).
 *
 * Letter classes (runs of the same viseme collapse into one step):
 *   m b p                 → closed
 *   f v s z x, c+e/i/y    → teeth
 *   o u w                 → round
 *   a                     → wide_open
 *   e                     → medium_open
 *   other letters/digits  → small_open
 *   space / punctuation   → rest   (sentence ends . ! ? hold longer)
 *
 * A sheet may also have a "blink" column (eyes shut, mouth at rest). isBlinking() gives a
 * blink schedule for the portrait to show it whenever the mouth is resting.
 *
 * @module lip-sync
 */

export const DEFAULT_STEP_MS = 90;
export const SENTENCE_END_HOLD = 2; // "." / "!" / "?" rests last this many steps

/**
 * Classify one character (lower-case, accents stripped) given the character after it.
 * @param {string} ch
 * @param {string} next
 * @returns {string} viseme name
 */
function classifyChar(ch, next) {
    if ('mbp'.includes(ch)) return 'closed';
    if ('fvszx'.includes(ch)) return 'teeth';
    if (ch === 'c' && next && 'eiy'.includes(next)) return 'teeth'; // soft c: "city", "face"
    if ('ouw'.includes(ch)) return 'round';
    if (ch === 'a') return 'wide_open';
    if (ch === 'e') return 'medium_open';
    if (/[\p{L}\p{N}]/u.test(ch)) return 'small_open';
    return 'rest';
}

/**
 * Convert a line of dialogue into a viseme timeline.
 * Always starts and finishes on "rest"; an empty line is a single rest step.
 * @param {string} text
 * @param {Object} [options]
 * @param {number} [options.stepMs=90] - Duration of one step
 * @param {number} [options.sentenceHold=2] - Multiplier for rests containing . ! ?
 * @returns {Array<{viseme: string, duration: number}>}
 */
export function textToVisemes(text, options = {}) {
    const stepMs = options.stepMs ?? DEFAULT_STEP_MS;
    const sentenceHold = options.sentenceHold ?? SENTENCE_END_HOLD;

    // Strip accents so "café" reads as "cafe"
    const chars = Array.from(String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase());

    const steps = [{ viseme: 'rest', duration: stepMs }];
    for (let i = 0; i < chars.length; i++) {
        const viseme = classifyChar(chars[i], chars[i + 1]);
        const last = steps[steps.length - 1];
        if (last.viseme !== viseme) {
            steps.push({ viseme, duration: stepMs });
        }
        // A rest run that contains sentence-end punctuation holds a little longer
        if (viseme === 'rest' && /[.!?]/.test(chars[i])) {
            steps[steps.length - 1].duration = stepMs * sentenceHold;
        }
    }
    if (steps[steps.length - 1].viseme !== 'rest') {
        steps.push({ viseme: 'rest', duration: stepMs });
    }
    return steps;
}

/**
 * Total duration of a timeline in ms.
 * @param {Array<{duration: number}>} steps
 */
export function timelineDuration(steps) {
    return steps.reduce((sum, s) => sum + s.duration, 0);
}

/**
 * Stretch or squash a timeline so it spans totalMs, keeping each step's relative length.
 * Returns the steps unchanged when totalMs is not a usable number.
 * @param {Array<{viseme: string, duration: number}>} steps
 * @param {number} totalMs
 */
export function scaleTimeline(steps, totalMs) {
    const current = timelineDuration(steps);
    if (!Number.isFinite(totalMs) || totalMs <= 0 || current <= 0) return steps;
    const factor = totalMs / current;
    return steps.map(s => ({ viseme: s.viseme, duration: s.duration * factor }));
}

// Shortest time a mouth shape stays up once the line is timed to its audio. Letter-level
// steps run ~80 ms in normal speech, which reads as the mouth flickering; hand-animated lip
// sync holds each shape for about 2 frames at 12 fps.
export const MIN_HOLD_MS = 140;

// Which shape survives when two short steps merge: the ones the eye catches win (lips
// closing on m/b/p, open vowels) over the in-between consonant shape.
const VISEME_WEIGHT = {
    closed: 5, wide_open: 4, round: 4, medium_open: 3, teeth: 3, rest: 2, small_open: 1
};

/**
 * Merge steps shorter than minMs into their neighbours so no shape flashes by. The total
 * duration is unchanged. Each merged step shows whichever of its shapes weighs most, and the
 * first and last steps stay "rest".
 * @param {Array<{viseme: string, duration: number}>} steps
 * @param {number} [minMs=MIN_HOLD_MS]
 * @returns {Array<{viseme: string, duration: number}>}
 */
export function holdTimeline(steps, minMs = MIN_HOLD_MS) {
    if (!(minMs > 0) || steps.length < 3) return steps.map(s => ({ ...s }));
    const weight = v => VISEME_WEIGHT[v] ?? 1;
    const first = { ...steps[0] };
    const last = { ...steps[steps.length - 1] };
    const out = [];
    for (const step of steps.slice(1, -1)) {
        const prev = out[out.length - 1];
        if (prev && prev.duration < minMs) {
            if (weight(step.viseme) > weight(prev.viseme)) prev.viseme = step.viseme;
            prev.duration += step.duration;
        } else {
            out.push({ ...step });
        }
    }
    // A short tail joins the step before it
    if (out.length > 1 && out[out.length - 1].duration < minMs) {
        const tail = out.pop();
        const prev = out[out.length - 1];
        if (weight(tail.viseme) > weight(prev.viseme)) prev.viseme = tail.viseme;
        prev.duration += tail.duration;
    }
    // Neighbours that ended up the same shape become one step
    const merged = [];
    for (const step of [first, ...out, last]) {
        const prev = merged[merged.length - 1];
        if (prev && prev.viseme === step.viseme) prev.duration += step.duration;
        else merged.push(step);
    }
    return merged;
}

/**
 * Viseme to show at elapsedMs into the timeline ("rest" before the start and after the end).
 * @param {Array<{viseme: string, duration: number}>} steps
 * @param {number} elapsedMs
 * @returns {string}
 */
export function visemeAt(steps, elapsedMs) {
    if (!(elapsedMs >= 0)) return 'rest';
    let t = 0;
    for (const step of steps) {
        t += step.duration;
        if (elapsedMs < t) return step.viseme;
    }
    return 'rest';
}

// Preferred substitutes when a sheet lacks a viseme, most similar first. Aliases cover
// the Preston Blair style names some viseme sets use (MBP, FV, WQ, AI, O, U, E).
const VISEME_FALLBACKS = {
    rest:        ['rest', 'closed', 'mbp'],
    closed:      ['closed', 'mbp', 'rest'],
    teeth:       ['teeth', 'fv', 'small_open', 'closed', 'rest'],
    round:       ['round', 'o', 'u', 'wq', 'small_open', 'medium_open'],
    wide_open:   ['wide_open', 'ai', 'open', 'medium_open', 'small_open'],
    medium_open: ['medium_open', 'e', 'open', 'wide_open', 'small_open'],
    small_open:  ['small_open', 'medium_open', 'open', 'e']
};

/**
 * Build a lookup from requested viseme name to a column index in a sheet whose columns
 * are named by `names`. Missing visemes fall back to the nearest available shape, then
 * to any "*open*" column, then to rest (or column 0).
 * @param {string[]} names - visemes[i] names column i
 * @returns {Object<string, number>} requested viseme → column index
 */
export function buildVisemeColumnMap(names) {
    const index = new Map();
    names.forEach((name, i) => {
        const key = String(name).toLowerCase();
        if (!index.has(key)) index.set(key, i);
    });
    const find = candidates => {
        for (const c of candidates) {
            if (index.has(c)) return index.get(c);
        }
        return undefined;
    };

    const restCol = find(VISEME_FALLBACKS.rest) ?? 0;
    const anyOpen = [...index.keys()].find(k => k.includes('open'));

    const map = {};
    for (const [viseme, candidates] of Object.entries(VISEME_FALLBACKS)) {
        let col = find(candidates);
        if (col === undefined && viseme !== 'rest' && viseme !== 'closed' && anyOpen !== undefined) {
            col = index.get(anyOpen);
        }
        map[viseme] = col ?? restCol;
    }
    if (index.has('blink')) map.blink = index.get('blink'); // no fallback: no column, no blink
    return map;
}

export const BLINK_MS = 130;
const BLINK_SLOT_MS = 4000;

/**
 * Whether the eyes are shut at time nowMs, on an irregular schedule of one blink per 4 s
 * slot, placed 1–3 s into the slot, so blinks come 2–6 s apart and look unplanned. Pure
 * and stateless: the same (nowMs, seed) always gives the same answer, so each portrait can
 * pass its own seed to avoid two speakers blinking in unison.
 * @param {number} nowMs
 * @param {number} [seed=0]
 * @returns {boolean}
 */
export function isBlinking(nowMs, seed = 0) {
    if (!Number.isFinite(nowMs)) return false;
    const slot = Math.floor(nowMs / BLINK_SLOT_MS);
    // Integer hash of (slot, seed) → 0..1
    let h = Math.imul(slot ^ Math.imul(seed | 0, 0x9e3779b1), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    const offset = 1000 + ((h >>> 0) / 0xffffffff) * 2000;
    const t = nowMs - slot * BLINK_SLOT_MS;
    return t >= offset && t < offset + BLINK_MS;
}

/**
 * Small stable number from a string (an NPC id), for isBlinking's seed.
 * @param {string} text
 */
export function seedFrom(text) {
    let h = 0;
    for (const ch of String(text ?? '')) h = (Math.imul(h, 31) + ch.codePointAt(0)) | 0;
    return h;
}
