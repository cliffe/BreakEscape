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

// A lock refusal with no hint is still read before it goes (PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md
// 7: "Server Riser access denied" was gone too soon): the same by-length rule, from 5 s.
export const REFUSAL_MIN_MS = 5000;

/**
 * Toast duration for a lock refusal, hint or not: by the length of the whole line shown
 * (`base`, the same text given to appendLockedHint or withLockedHint, plus the hint when
 * there is one), 300 ms a word, at least 6 s with a hint and 5 s without, at most 12 s.
 * `plainMs`, the caller's own time, is kept when it is longer.
 */
export function lockedHintDuration(lockable, plainMs, base) {
    const hint = getLockedHint(lockable);
    const plain = Number.isFinite(Number(plainMs)) ? Number(plainMs) : 0;
    if (hint) return Math.max(plain, hintToastMs(`${base ?? ''} ${hint}`));
    const words = String(base ?? '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(plain, Math.min(HINT_MAX_MS, Math.max(REFUSAL_MIN_MS, words * HINT_MS_PER_WORD)));
}

// The first part of a door sign, before a separator: "Records Office — Authorised Access
// Only" titles its refusal "Records Office". A separator is a dash with spaces round it, a
// colon, a comma, or a full stop after a word of three or more letters (so "Dr. I. Volkova"
// is not cut at "Dr"). A title still longer than SIGN_TITLE_MAX after the cut is not used.
const SIGN_SEPARATOR = /\s+(?:[—–]+|-{1,2})\s+|:\s*|,\s*|(?<=[A-Za-z]{3})\.(?:\s+|$)/;
export const SIGN_TITLE_MAX = 28;

/** Pure: a door sign cut to a toast title, or '' when there is none or it is too long. */
export function signTitle(sign) {
    if (typeof sign !== 'string') return '';
    const t = sign.split(SIGN_SEPARATOR)[0].trim();
    return t.length > SIGN_TITLE_MAX ? '' : t;
}

/**
 * The title of a door's refusal toast: the door's sign when it has one ("Server Riser"), in
 * place of a generic title such as "Access Denied". Anything that is not a door with a sign
 * keeps `fallback`. Used by RFID and gate refusals only (review R2 n8).
 */
export function doorRefusalTitle(lockable, fallback) {
    return signTitle(lockable?.doorProperties?.door_sign) || fallback;
}

/** Shows the hint alone, as a refusal toast (for locks whose own overlay already said no). */
export function showLockedHintToast(lockable) {
    const hint = getLockedHint(lockable);
    if (hint) window.gameAlert?.(hint, 'error', 'Locked', hintToastMs(hint));
}
