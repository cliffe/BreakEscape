/**
 * An NPC that wears the player's chosen avatar (P5-4, E7: a learner who picked female_blowse_v2
 * met Agnieszka Duda in the same sprite, two identical figures 200 px apart).
 *
 * The player's choice always stands (aw9). The NPC changes instead: its world sprite swaps to
 * another stock sprite of the same set (female or male) that neither the player nor any other
 * character in the scenario uses, and a stock talk portrait or viseme sheet (the one named after
 * its sprite) follows, so the chat shows the face that walked up. A custom portrait (one not
 * named after the sprite) is the author's and stays. Only NPCs with a world sprite are touched.
 *
 * Pure apart from mutating the NPC objects avoidPlayerLookalike is given.
 */

// The stock office-wear sprites, in preference order. Hooded sprites are left out: a hooded
// figure in a training room reads as the attacker.
const POOLS = Object.freeze({
    female: Object.freeze(['female_office_worker_v2', 'female_telecom_v2', 'female_scientist_v2',
        'female_security_guard_v2', 'female_blowse_v2']),
    male: Object.freeze(['male_office_worker_v2', 'male_telecom_v2', 'male_nerd_v2',
        'male_security_guard_v2', 'male_spy_v2'])
});
const SPRITE_NPC_TYPES = ['person', 'both'];

const isStr = (v) => typeof v === 'string' && v.length > 0;

/** A saved legacy key (female_blowse) counts as its redraw (female_blowse_v2). */
function normalise(key) {
    if (!isStr(key)) return '';
    if (key.endsWith('_v2')) return key;
    const v2 = `${key}_v2`;
    return POOLS.female.includes(v2) || POOLS.male.includes(v2) ? v2 : key;
}

function poolOf(key) {
    if (key.startsWith('female_')) return POOLS.female;
    if (key.startsWith('male_')) return POOLS.male;
    return null;
}

/** "female_blowse" for female_blowse_v2, assets/characters/female_blowse_talk.png and _visemes.png. */
function stemOf(pathOrKey) {
    return (String(pathOrKey).split('/').pop() || '')
        .replace(/\.\w+$/, '').replace(/[_-](talk|visemes|headshot)$/, '').replace(/_v2$/, '');
}

/**
 * The swap for one NPC, or null when it does not wear the player's sprite (or has no world
 * sprite, or no stock alternative is free). `used` lists the sprite keys other characters in
 * the scenario wear; the alternative avoids them when it can.
 *   -> { spriteSheet, spriteTalk?, spriteVisemes? }
 */
export function lookalikeSwap(npc, playerSprite, used = []) {
    if (!npc || typeof npc !== 'object' || !SPRITE_NPC_TYPES.includes(npc.npcType)) return null;
    const player = normalise(playerSprite);
    const own = normalise(npc.spriteSheet);
    if (!player || own !== player) return null;
    const pool = poolOf(own);
    if (!pool) return null;
    const taken = new Set((used || []).map(normalise));
    const free = pool.filter((k) => k !== player);
    const pick = free.find((k) => !taken.has(k)) || free[0];
    if (!pick) return null;
    const out = { spriteSheet: pick };
    const ownStem = stemOf(own);
    const pickStem = stemOf(pick);
    if (isStr(npc.spriteTalk) && stemOf(npc.spriteTalk) === ownStem) out.spriteTalk = `assets/characters/${pickStem}_talk.png`;
    if (isStr(npc.spriteVisemes) && stemOf(npc.spriteVisemes) === ownStem) out.spriteVisemes = `assets/characters/${pickStem}_visemes.png`;
    return out;
}

/**
 * Apply lookalikeSwap to a room's NPC list in place. Each swapped NPC keeps its authored key in
 * `authoredSpriteSheet`. Returns the ids changed.
 */
export function avoidPlayerLookalike(npcs, playerSprite, used = []) {
    const changed = [];
    for (const npc of Array.isArray(npcs) ? npcs : []) {
        if (npc && npc.authoredSpriteSheet) continue; // already swapped
        const swap = lookalikeSwap(npc, playerSprite, used);
        if (!swap) continue;
        npc.authoredSpriteSheet = npc.spriteSheet;
        Object.assign(npc, swap);
        changed.push(npc.id);
    }
    return changed;
}
