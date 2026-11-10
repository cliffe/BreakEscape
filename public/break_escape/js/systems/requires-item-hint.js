/**
 * The refusal text of an object with `requiresItem`, shown when the player clicks it
 * without the item in hand (interactions.js). It resolves like every other object
 * text: `requiresItemHintVariants` ([{ condition, value }], first match wins), then
 * `requiresItemHint`, then the default. Kept apart from interactions.js so it can be
 * tested without Phaser.
 */
import { resolveObjectField } from '../utils/conditional-text.js';

export const DEFAULT_REQUIRES_ITEM_HINT = 'You need the right kit in hand for this.';

// A hint can carry a sentence or two of teaching, so its toast lasts by length:
// 300 ms per word, at least 6 s and at most 12 s.
export const HINT_MS_PER_WORD = 300;
export const HINT_MIN_MS = 6000;
export const HINT_MAX_MS = 12000;

export function requiresItemHintMs(text) {
    const words = String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
    return Math.min(HINT_MAX_MS, Math.max(HINT_MIN_MS, words * HINT_MS_PER_WORD));
}

export function requiresItemHint(data, globalVars = null) {
    return resolveObjectField(data, 'requiresItemHint', DEFAULT_REQUIRES_ITEM_HINT, globalVars)
        || DEFAULT_REQUIRES_ITEM_HINT;
}
