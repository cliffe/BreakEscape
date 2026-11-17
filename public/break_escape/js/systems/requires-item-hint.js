/**
 * The refusal text of an object with `requiresItem`, shown when the player clicks it
 * without the item in hand (interactions.js). It resolves like every other object
 * text: `requiresItemHintVariants` ([{ condition, value }], first match wins), then
 * `requiresItemHint`, then the default. Kept apart from interactions.js so it can be
 * tested without Phaser. The toast lasts by length (hintToastMs, utils/locked-hint.js).
 */
import { resolveObjectField, evaluateGlobalCondition } from '../utils/conditional-text.js';

export const DEFAULT_REQUIRES_ITEM_HINT = 'You need the right kit in hand for this.';

export function requiresItemHint(data, globalVars = null) {
    return resolveObjectField(data, 'requiresItemHint', DEFAULT_REQUIRES_ITEM_HINT, globalVars)
        || DEFAULT_REQUIRES_ITEM_HINT;   // an authored empty string
}

export const DEFAULT_REQUIRES_ITEM_CONDITION_HINT = 'Not now.';

/**
 * `requiresItemCondition`: a requiresItem object can also say WHEN the item may be used, as a
 * globals condition (the observationVariants syntax). With the item held and the condition
 * false, the actions do not fire and nothing is consumed; the player sees
 * `requiresItemConditionHint` (with `requiresItemConditionHintVariants`, first match wins).
 * Returns that refusal text, or null when the use may go ahead (no condition, or it holds).
 * Only the triggerOnInteract branch of interactions.js reads it: on an object without
 * triggerOnInteract, or on a networkJack, it is ignored (the validator warns).
 * lab_physical_pentest gates the keylogger plant on Chris being away from her desk
 * (`globalVars.staff_pc_owner_away`, workstation-state.js), as its hint has always said.
 */
export function requiresItemConditionRefusal(data, globalVars = null) {
    const cond = data?.requiresItemCondition;
    if (typeof cond !== 'string' || !cond.trim()) return null;
    const vars = globalVars
        || (typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {};
    if (evaluateGlobalCondition(cond, vars)) return null;
    return resolveObjectField(data, 'requiresItemConditionHint', DEFAULT_REQUIRES_ITEM_CONDITION_HINT, vars)
        || DEFAULT_REQUIRES_ITEM_CONDITION_HINT;
}
