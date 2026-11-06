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

/** Toast duration for a refusal line: longer when it carries a hint to read. */
export function lockedHintDuration(lockable, plainMs) {
    return getLockedHint(lockable) ? 5500 : plainMs;
}

/** Shows the hint alone, as a refusal toast (for locks whose own overlay already said no). */
export function showLockedHintToast(lockable) {
    const hint = getLockedHint(lockable);
    if (hint) window.gameAlert?.(hint, 'error', 'Locked', 5500);
}
