/**
 * Phone-chat choice helpers: number-key shortcuts and the "more choices" scroll cue.
 * Kept free of DOM and game state so node tests can load it directly.
 *
 * @module phone-chat-choices
 */

/** Highest choice reachable with a number key (keys 1–9). */
export const MAX_QUICK_CHOICE = 9;

/**
 * Map a key to a zero-based choice index, or -1 when the key picks nothing.
 * @param {string} key - KeyboardEvent.key
 * @param {number} choiceCount - number of choices on screen
 */
export function choiceIndexFromKey(key, choiceCount) {
    if (typeof key !== 'string' || !/^[1-9]$/.test(key)) return -1;
    const index = Number(key) - 1;
    return index < choiceCount ? index : -1;
}

/**
 * True when part of the choice list is hidden below the visible area.
 * @param {{scrollTop:number, clientHeight:number, scrollHeight:number}} el
 */
export function hasHiddenChoicesBelow(el) {
    if (!el) return false;
    // 2px slack absorbs sub-pixel rounding at the end of the list
    return el.scrollTop + el.clientHeight < el.scrollHeight - 2;
}
