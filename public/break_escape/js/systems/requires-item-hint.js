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

/**
 * `postitNoteVariants` on a PC (ca09's sticky note): the entry that is on the screen right now, as
 * { note, submitText }, or null when none is. A PC lists the states that carry a note as
 * [{ condition, value, submitText }] (first match wins, the observationVariants syntax); in every
 * other state the click goes on as before (ca09: the requiresItem refusal). Only a plain PC
 * counts: a `lockType: "login"` or locked PC serves its own note (postit-marks.js,
 * unlock-system.js). The base `postitNote` is not consulted. The matching entry must carry a
 * non-empty `submitText`: the view has no lock to check a submit against, so an entry without one
 * is refused (null) and the click goes on as before.
 * interactions.js opens the shared password view (the one m01's Derek PC shows its post-it in)
 * with the note and no way to sign in: the PC stays Chidi's to sign in to.
 */
export function pcPostitVariantNow(data, globalVars = null) {
    if (!data || data.type !== 'pc' || data.lockType === 'login' || data.locked === true
        || !Array.isArray(data.postitNoteVariants)) return null;
    const vars = globalVars || (typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {};
    for (const v of data.postitNoteVariants) {
        if (!v || typeof v.value !== 'string') continue;
        if (v.condition && !evaluateGlobalCondition(v.condition, vars)) continue;
        const note = v.value;
        const submitText = typeof v.submitText === 'string' ? v.submitText.trim() : '';
        if (!note.trim() || !submitText) return null;
        return { note, submitText };
    }
    return null;
}

/** The note text of pcPostitVariantNow, or ''. */
export function pcPostitNoteNow(data, globalVars = null) {
    return pcPostitVariantNow(data, globalVars)?.note || '';
}

/** The fixed submit line of pcPostitVariantNow, or ''. */
export function pcPostitSubmitText(data, globalVars = null) {
    return pcPostitVariantNow(data, globalVars)?.submitText || '';
}
