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
