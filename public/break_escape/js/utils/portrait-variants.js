import { evaluateGlobalCondition } from './global-condition.js';

/**
 * Alternative dialogue portraits for one NPC (a knocked-out bust, a disguise).
 *
 * An NPC can carry an optional list:
 *   "portraitVariants": [
 *     { "name": "ko", "ko": true,
 *       "spriteTalk": "assets/characters/david_torres_ko_talk.png",
 *       "spriteVisemes": "assets/characters/david_torres_ko_visemes.png",
 *       "avatar": "assets/characters/david_torres_ko_headshot.png" },
 *     { "name": "night", "condition": "globalVars.night_shift === true", "spriteTalk": "..." }
 *   ]
 *
 * Gates (both optional; when both are given, both must hold):
 *   condition - globalVars syntax (utils/global-condition.js: !, ===, !==, <, >, &&, ||)
 *   ko        - true: the NPC is knocked out (npc-hostile.js state, or its globalVarOnKO
 *               global is true); false: it is not
 * A variant with neither gate is used only when an ink `# portrait:<name>` tag names it.
 *
 * The first variant whose gates hold wins; its spriteTalk / spriteVisemes / avatar
 * replace the NPC's, and any field it leaves out keeps the base value. No match gives
 * the base fields. A `# portrait:<name>` tag forces that variant for the rest of the
 * conversation (`# portrait:base` forces the base fields).
 *
 * Read by person-chat (each time a speaker's portrait is drawn, so a global set
 * mid-conversation takes effect at the next line) and by phone-chat (avatar).
 */

export const PORTRAIT_FIELDS = ['spriteTalk', 'spriteVisemes', 'avatar'];
export const BASE_PORTRAIT = 'base';

/** Does this variant's gate hold? A variant with no gate only matches by name. */
function variantHolds(variant, globalVars, isKO) {
    const hasCondition = typeof variant.condition === 'string' && variant.condition.trim() !== '';
    const hasKO = typeof variant.ko === 'boolean';
    if (!hasCondition && !hasKO) return false;
    if (hasKO && variant.ko !== !!isKO) return false;
    if (hasCondition) {
        try { return evaluateGlobalCondition(variant.condition, globalVars || {}) === true; } catch (err) { return false; }
    }
    return true;
}

/**
 * Pure: which variant applies, or null for the base fields.
 * @param {Object} npc - the NPC's scenario data
 * @param {Object} [o]
 * @param {Object} [o.globalVars] - the game's global variables
 * @param {boolean} [o.isKO] - the NPC is knocked out
 * @param {string|null} [o.forced] - a name set by `# portrait:<name>` ('base' = no variant)
 * @returns {Object|null}
 */
export function pickPortraitVariant(npc, { globalVars = {}, isKO = false, forced = null } = {}) {
    const variants = Array.isArray(npc?.portraitVariants) ? npc.portraitVariants.filter(v => v && typeof v === 'object') : [];
    if (typeof forced === 'string' && forced.trim()) {
        const name = forced.trim();
        if (name === BASE_PORTRAIT) return null;
        const named = variants.find(v => v.name === name);
        if (named) return named;
        // An unknown name falls through to the gates, as if no tag had been given
    }
    return variants.find(v => variantHolds(v, globalVars, isKO)) || null;
}

/**
 * Pure: the NPC with the matching variant's portrait fields laid over its own.
 * Returns the NPC object itself when no variant applies, else a shallow copy
 * (so the scenario's NPC is never changed).
 */
export function applyPortraitVariant(npc, opts = {}) {
    const variant = pickPortraitVariant(npc, opts);
    if (!variant) return npc;
    const out = { ...npc };
    for (const f of PORTRAIT_FIELDS) {
        if (typeof variant[f] === 'string' && variant[f].trim()) out[f] = variant[f].trim();
    }
    out.portraitVariant = variant.name || null;
    return out;
}

/**
 * Is this NPC knocked out right now? The combat state first (set before npc_ko fires),
 * then its globalVarOnKO global (survives a reload).
 */
export function npcIsKO(npc, w = (typeof window !== 'undefined' ? window : {})) {
    if (!npc?.id) return false;
    if (w.npcHostileSystem?.isNPCKO?.(npc.id) === true) return true;
    const koVar = npc.globalVarOnKO;
    return !!(koVar && w.gameState?.globalVariables?.[koVar] === true);
}

/**
 * The NPC as its portrait should look now, reading live game state.
 * @param {Object} npc
 * @param {string|null} [forced] - a name set by `# portrait:<name>`
 * @param {Object} [w] - the window (injectable for tests)
 */
export function portraitFor(npc, forced = null, w = (typeof window !== 'undefined' ? window : {})) {
    if (!npc || !Array.isArray(npc.portraitVariants) || npc.portraitVariants.length === 0) return npc;
    return applyPortraitVariant(npc, {
        globalVars: w.gameState?.globalVariables || {},
        isKO: npcIsKO(npc, w),
        forced
    });
}

/**
 * Parse a `# portrait:` tag parameter: "<name>" (the conversation's NPC) or
 * "<npc_id>:<name>" (another character in the scene).
 * @returns {{npcId: string|null, name: string}|null}
 */
export function parsePortraitTag(param) {
    if (typeof param !== 'string' || !param.trim()) return null;
    const parts = param.split(':').map(s => s.trim()).filter(Boolean);
    if (parts.length === 1) return { npcId: null, name: parts[0] };
    if (parts.length === 2) return { npcId: parts[0], name: parts[1] };
    return null;
}
