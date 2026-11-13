/**
 * Whether a PC's world observations (its "password locked" line) are shown in the world menu
 * and the HUD label. They describe the lock, so they go once the PC is unlocked. Anything that
 * is not a PC keeps its observations. Pure: the caller passes the session store.
 */

/**
 * True for a PC with a screen and a lock: type "pc" with a password or a sign-in. Other
 * type "pc" objects (wall ports, switches, USB sockets, a headless controller) keep their
 * observations, and so does a PC with no lock, which has nothing to unlock.
 */
export function isPcData(data) {
    return !!data && typeof data === 'object' && data.type === 'pc' && data.headless !== true &&
        (data.lockType === 'login' || data.lockType === 'password');
}

/**
 * True while the PC still needs a password or sign-in. A sign-in PC is locked with no held
 * session or with a locked one (the state its sign-in screen reads); any other PC is locked
 * while its own `locked` flag is true (the client clears it when the password is entered).
 */
export function isPcLocked(data, sessions) {
    if (!isPcData(data)) return false;
    if (data.lockType === 'login') {
        const id = data.id;
        if (!id || !sessions?.has) return data.locked === true;
        return !sessions.has(id) || sessions.isLocked?.(id) === true;
    }
    return data.locked === true;
}

/** The observations to show for an object: a PC drops them once unlocked. */
export function worldObservations(data, observations, sessions) {
    if (isPcData(data) && !isPcLocked(data, sessions)) return null;
    return observations;
}
