/**
 * Toast text for an influence change, using the NPC's own display name.
 * @param {string} type - tag type, e.g. 'influence_gained', 'rapport_lost'
 * @param {number} amount
 * @param {'gained'|'lost'} direction
 * @param {{displayName?: string}} [npc]
 * @returns {string}
 */
export function getInfluenceMessage(type, amount, direction, npc) {
    const baseType = String(type).replace('_gained', '').replace('_lost', '');
    const big = amount >= 10;
    const name = npc?.displayName;

    if (name) {
        if (direction === 'gained') {
            return big ? `${name} really likes that` : `${name} appreciates that`;
        }
        return big ? `${name} is disappointed` : `${name} seems uncertain`;
    }
    if (baseType === 'influence') {
        if (direction === 'gained') return big ? 'Influence significantly increased' : 'Influence increased';
        return big ? 'Influence significantly decreased' : 'Influence decreased';
    }
    return `${baseType} ${direction}`;
}
