/**
 * The opt-in `lockedHint` a scenario may author on a door or room (SE lab F17), read from
 * wherever the lockable carries it. Returns '' when there is none, so callers can fall back
 * to their plain message and a mission without the field behaves as before.
 */
export function getLockedHint(lockable) {
    const hint = lockable?.lockedHint || lockable?.doorProperties?.lockedHint ||
                 lockable?.scenarioData?.lockedHint || lockable?.properties?.lockedHint || '';
    return typeof hint === 'string' ? hint : '';
}

/** `base`, with the lockedHint appended on a new sentence when the lockable has one. */
export function withLockedHint(base, lockable) {
    const hint = getLockedHint(lockable);
    return hint ? `${base} ${hint}` : base;
}

/**
 * A refusal line for a non-key lock: `base` with the lockedHint as a following sentence
 * (a trailing full stop on `base` is not doubled). Same wording style as the key lock's
 * "Requires key. <hint>". Returns `base` unchanged when there is no hint.
 */
export function appendLockedHint(base, lockable) {
    const hint = getLockedHint(lockable);
    return hint ? `${String(base).replace(/[.\s]+$/, '')}. ${hint}` : base;
}

// A toast that carries a hint lasts by length, so a sentence or two of teaching can be
// read: 300 ms per word, at least 6 s and at most 12 s. One rule for every hint toast:
// the locked hints here (every lock type, the key lock and its wrong-key lines included)
// and the requiresItem hint (interactions.js).
export const HINT_MS_PER_WORD = 300;
export const HINT_MIN_MS = 6000;
export const HINT_MAX_MS = 12000;

export function hintToastMs(text) {
    const words = String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
    return Math.min(HINT_MAX_MS, Math.max(HINT_MIN_MS, words * HINT_MS_PER_WORD));
}

// apply-actions.js reads the rule from here for its `hint` action. It is not imported
// there: that file is copied by many node test harnesses that stub only its known
// imports (see the note at its top).
if (typeof window !== 'undefined') window.hintToastMs = hintToastMs;

/**
 * Toast duration for a refusal line: `plainMs` without a hint; with one, by the length
 * of the whole line shown (`base`, the same text given to appendLockedHint or
 * withLockedHint, plus the hint).
 */
export function lockedHintDuration(lockable, plainMs, base) {
    const hint = getLockedHint(lockable);
    if (!hint) return plainMs;
    return hintToastMs(`${base ?? ''} ${hint}`);
}

/** Shows the hint alone, as a refusal toast (for locks whose own overlay already said no). */
export function showLockedHintToast(lockable) {
    const hint = getLockedHint(lockable);
    if (hint) window.gameAlert?.(hint, 'error', 'Locked', hintToastMs(hint));
}
