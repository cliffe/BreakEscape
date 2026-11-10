/**
 * The refusal text of an object with `requiresItem`, shown when the player clicks it
 * without the item in hand (interactions.js). It resolves like every other object
 * text: `requiresItemHintVariants` ([{ condition, value }], first match wins), then
 * `requiresItemHint`, then the default. Kept apart from interactions.js so it can be
 * tested without Phaser.
 */
import { resolveObjectField } from '../utils/conditional-text.js';

export const DEFAULT_REQUIRES_ITEM_HINT = 'You need the right kit in hand for this.';

// A hint can carry a sentence of teaching, so it stays up longer than a plain notice.
export const REQUIRES_ITEM_HINT_MS = 6000;

export function requiresItemHint(data, globalVars = null) {
    return resolveObjectField(data, 'requiresItemHint', DEFAULT_REQUIRES_ITEM_HINT, globalVars)
        || DEFAULT_REQUIRES_ITEM_HINT;
}
