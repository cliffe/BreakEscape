/**
 * Repeat guard for interactions that more than one input handler can reach
 * from the same click (a door's own zone and game.js's scene pointerdown).
 * Returns true when the same target was interacted with less than windowMs
 * ago, and records the time otherwise.
 */
export const REPEAT_WINDOW_MS = 300;

export function isRepeatInteraction(target, now = Date.now(), windowMs = REPEAT_WINDOW_MS) {
    if (!target || typeof target !== 'object') return false;
    const last = target._lastInteractionAt;
    if (typeof last === 'number' && now - last >= 0 && now - last < windowMs) return true;
    target._lastInteractionAt = now;
    return false;
}
