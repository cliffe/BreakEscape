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
 * Button text for a choice: "1. text" for the nine number-key choices, the same
 * labels person-chat shows, so the keys can be found from the screen.
 * @param {string} text - choice text (already display-formatted)
 * @param {number} index - zero-based position in the list
 */
export function numberedChoiceText(text, index) {
    return index < MAX_QUICK_CHOICE ? `${index + 1}. ${text}` : text;
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
