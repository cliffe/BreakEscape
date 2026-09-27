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

// Shortest time a mouth shape stays up when the line is only stretched over the audio's
// length (no loudness curve to align to). Letter-level steps run ~75 ms in normal speech,
// which flickers; holding much longer drifts away from the words.
export const MIN_HOLD_MS = 100; // text-only fallback; audio-aligned lines use 60

// Which shape survives when two short steps merge: the ones the eye catches win (lips
// closing on m/b/p, open vowels) over the in-between consonant shape.
const VISEME_WEIGHT = {
    closed: 5, wide_open: 4, round: 4, medium_open: 3, teeth: 3, rest: 2, small_open: 1
};

/**
 * Merge steps shorter than minMs so no shape flashes by. The total duration is unchanged.
 * Consecutive short steps pool until they reach minMs and show whichever of their shapes
 * weighs most; a leftover too short to stand alone joins the heavier neighbour. Steps that
 * are already long enough keep their shape, so a real pause never turns into a mouth shape.
 * The first and last steps stay as they are ("rest").
 * @param {Array<{viseme: string, duration: number}>} steps
 * @param {number} [minMs=MIN_HOLD_MS]
 * @returns {Array<{viseme: string, duration: number}>}
 */
export function holdTimeline(steps, minMs = MIN_HOLD_MS) {
    if (!(minMs > 0) || steps.length < 3) return steps.map(s => ({ ...s }));
    const weight = v => VISEME_WEIGHT[v] ?? 1;
    const out = [];
    let pool = null;
    for (const step of steps.slice(1, -1)) {
        if (step.duration >= minMs) {
            const next = { ...step };
            if (pool) { // leftover: into the heavier side
                const prev = out[out.length - 1];
                if (prev && weight(prev.viseme) >= weight(next.viseme)) prev.duration += pool.duration;
                else next.duration += pool.duration;
                pool = null;
            }
            out.push(next);
            continue;
        }
        if (!pool) pool = { ...step };
        else {
            pool.duration += step.duration;
            if (weight(step.viseme) > weight(pool.viseme)) pool.viseme = step.viseme;
        }
        if (pool.duration >= minMs) { out.push(pool); pool = null; }
    }
    if (pool) {
        if (out.length) out[out.length - 1].duration += pool.duration;
        else out.push(pool);
    }
    // Neighbours that ended up the same shape become one step
    const merged = [];
    for (const step of [{ ...steps[0] }, ...out, { ...steps[steps.length - 1] }]) {
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

// ------------------------------------------------------------ audio alignment
//
// The text alone says which shapes come in which order, not when: speech speeds up, slows
// down and pauses. So the shapes are fitted to the line's loudness curve, decoded from the
// TTS audio (TTSManager does that per line). Open vowels land on loud stretches, closed
// lips and fricatives in the dips, punctuation on silences, and near-silent frames always
// show rest.

export const ENVELOPE_FRAME_MS = 20;

/**
 * Loudness curve: RMS of each frameMs slice of the samples.
 * @param {Float32Array|number[]} samples - mono PCM, -1..1
 * @param {number} sampleRate
 * @param {number} [frameMs=ENVELOPE_FRAME_MS]
 * @returns {Float32Array}
 */
export function envelopeFromSamples(samples, sampleRate, frameMs = ENVELOPE_FRAME_MS) {
    const size = Math.max(1, Math.round(sampleRate * frameMs / 1000));
    const n = Math.floor(samples.length / size);
    const env = new Float32Array(n);
    for (let f = 0; f < n; f++) {
        let sum = 0;
        for (let i = f * size; i < (f + 1) * size; i++) sum += samples[i] * samples[i];
        env[f] = Math.sqrt(sum / size);
    }
    return env;
}

// Loudness each unit expects, 0 (silence) to 1 (the line's loud peaks).
const UNIT_ENERGY = {
    pause: 0, gap: 0.35,
    closed: 0.15, teeth: 0.4, small_open: 0.55, round: 0.7, medium_open: 0.75, wide_open: 0.9, rest: 0.35
};
const SILENT = 0.08; // normalised loudness below which a frame is silence

/**
 * The line as alignment units, in order: 'sound' (letters, one viseme per run), 'gap'
 * (a space between words, often not a pause in speech) and 'pause' (punctuation, usually
 * a real silence). Each carries a weight: roughly how long it should last relative to the
 * others (letters in the run; 2 for , ; : --, 4 for . ! ?).
 * @param {string} text
 * @returns {Array<{kind: string, viseme: string, weight: number}>}
 */
export function textToUnits(text) {
    const chars = Array.from(String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase());
    const units = [];
    const add = (kind, viseme, weight) => {
        const last = units[units.length - 1];
        if (last && kind === 'pause' && last.kind === 'gap') units.pop();             // "word ," → pause
        const prev = units[units.length - 1];
        if (prev && kind === 'gap' && prev.kind === 'pause') return;                   // ", word" → pause
        if (prev && prev.kind === kind && prev.viseme === viseme) {
            prev.weight = kind === 'pause' ? Math.max(prev.weight, weight) : prev.weight + weight;
            return;
        }
        units.push({ kind, viseme, weight });
    };
    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (/\s/.test(ch)) add('gap', 'rest', 0.3);
        else if (/[\p{L}\p{N}]/u.test(ch)) add('sound', classifyChar(ch, chars[i + 1]), 1);
        else if (/[.!?]/.test(ch)) add('pause', 'rest', 4);
        else if (/[,;:]/.test(ch) || (ch === '-' && (chars[i + 1] === '-' || chars[i - 1] === '-'))) add('pause', 'rest', 2);
        else if (ch === '-') add('gap', 'rest', 0.3);                                  // "half-ten"
        // apostrophes, quotes, asterisks: no sound of their own
    }
    return units;
}

/**
 * Fit the line's units to its loudness curve. Returns a timeline spanning the whole audio
 * (envelope.length * frameMs), or null when there is nothing usable to align to.
 *
 * Each unit gets a contiguous run of frames, in order. A run costs how far the frames'
 * loudness is from the unit's expected loudness, plus a penalty for straying far from the
 * unit's expected length (its weight's share of the voiced or silent time). The cheapest
 * split is found by dynamic programming over (unit, end frame, run length).
 *
 * @param {string} text
 * @param {Float32Array|number[]} envelope - from envelopeFromSamples
 * @param {number} [frameMs=ENVELOPE_FRAME_MS]
 * @param {Object} [options]
 * @param {number} [options.minHoldMs=60] - merge shapes shorter than this (anti-flicker only)
 * @returns {Array<{viseme: string, duration: number}>|null}
 */
export function alignToEnvelope(text, envelope, frameMs = ENVELOPE_FRAME_MS, options = {}) {
    const T = envelope?.length || 0;
    const units = [{ kind: 'pause', viseme: 'rest', weight: 2 }, ...textToUnits(text),
                   { kind: 'pause', viseme: 'rest', weight: 2 }];
    const N = units.length;
    if (T < N || N < 3) return null;

    const sorted = Float32Array.from(envelope).sort();
    const ref = sorted[Math.floor(0.95 * (T - 1))];
    if (!(ref > 0)) return null;
    const e = Float32Array.from(envelope, v => Math.min(1, v / ref));

    const voiced = e.reduce((n, v) => n + (v >= SILENT ? 1 : 0), 0);
    const sumW = kinds => units.reduce((s, u) => s + (kinds.includes(u.kind) ? u.weight : 0), 0);
    const soundW = sumW(['sound', 'gap']) || 1;
    const pauseW = sumW(['pause']) || 1;
    const expected = u => u.kind === 'pause' ? 0 : UNIT_ENERGY[u.kind === 'gap' ? 'gap' : u.viseme] ?? 0.5;
    const prior = u => Math.max(1, u.kind === 'pause'
        ? u.weight / pauseW * Math.max(T - voiced, 1)
        : u.weight / soundW * Math.max(voiced, 1));
    const lambda = u => (u.kind === 'pause' ? 0.2 : u.kind === 'gap' ? 0.3 : 0.5);

    // prefix[k][t] = sum over frames < t of |energy_k - e|, one row per distinct energy
    const prefixes = new Map();
    const prefixFor = level => {
        if (!prefixes.has(level)) {
            const p = new Float64Array(T + 1);
            for (let t = 0; t < T; t++) p[t + 1] = p[t] + Math.abs(level - e[t]);
            prefixes.set(level, p);
        }
        return prefixes.get(level);
    };

    const W = T + 1;
    const best = new Float64Array((N + 1) * W).fill(Infinity);
    const runLen = new Int32Array((N + 1) * W);
    const logL = Float64Array.from({ length: T + 1 }, (_, L) => (L ? Math.log(L) : 0));
    // Each unit must end within a band around where its prior lengths put it (at least 2 s
    // or 12% of the line either side), which keeps long lines fast.
    const priors = units.map(prior);
    const scale = T / priors.reduce((a, b) => a + b, 0);
    const band = Math.max(Math.round(2000 / frameMs), Math.round(0.12 * T));
    let priorEnd = 0;
    best[0] = 0;
    for (let k = 1; k <= N; k++) {
        const u = units[k - 1];
        const P = prefixFor(expected(u));
        const d = priors[k - 1];
        const logD = Math.log(d);
        const lam = lambda(u);
        const cap = u.kind === 'pause' ? 1500 : 500;
        const Lmax = Math.max(2, Math.min(T, Math.ceil(Math.max(4 * d, cap / frameMs))));
        priorEnd += d * scale;
        const tFirst = Math.max(k, Math.floor(priorEnd) - band);
        const tLast = k === N ? T : Math.min(T - (N - k), Math.ceil(priorEnd) + band); // a frame for each later unit
        for (let t = tFirst; t <= tLast; t++) {
            let bestCost = Infinity, bestL = 0;
            const Ltop = Math.min(Lmax, t - (k - 1));
            for (let L = 1; L <= Ltop; L++) {
                const prev = best[(k - 1) * W + t - L];
                if (prev === Infinity) continue;
                const r = logL[L] - logD;
                const c = prev + (P[t] - P[t - L]) + lam * r * r;
                if (c < bestCost) { bestCost = c; bestL = L; }
            }
            best[k * W + t] = bestCost;
            runLen[k * W + t] = bestL;
        }
    }
    if (best[N * W + T] === Infinity) return null;

    // Walk back to each unit's run, then paint one viseme per frame
    const frames = new Array(T);
    let t = T;
    const runs = [];
    for (let k = N; k >= 1; k--) {
        const L = runLen[k * W + t];
        runs.push({ unit: units[k - 1], start: t - L, end: t });
        t -= L;
    }
    runs.reverse();
    let lastSound = 'small_open';
    for (const { unit, start, end } of runs) {
        let v = 'rest';
        if (unit.kind === 'sound') {
            v = lastSound = unit.viseme;
        } else if (unit.kind === 'gap') {
            let sum = 0;
            for (let i = start; i < end; i++) sum += e[i];
            v = sum / (end - start) < 0.15 ? 'rest' : lastSound; // a word break the speaker ran through
        }
        for (let i = start; i < end; i++) frames[i] = v;
    }
    // Two or more near-silent frames in a row always rest
    for (let i = 0; i < T; i++) {
        if (e[i] < SILENT * 0.6 && ((i > 0 && e[i - 1] < SILENT * 0.6) || (i + 1 < T && e[i + 1] < SILENT * 0.6))) {
            frames[i] = 'rest';
        }
    }

    const steps = [];
    for (const v of frames) {
        const last = steps[steps.length - 1];
        if (last && last.viseme === v) last.duration += frameMs;
        else steps.push({ viseme: v, duration: frameMs });
    }
    if (steps[0].viseme !== 'rest') steps.unshift({ viseme: 'rest', duration: 0 });
    if (steps[steps.length - 1].viseme !== 'rest') steps.push({ viseme: 'rest', duration: 0 });
    return holdTimeline(steps, options.minHoldMs ?? 60);
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
