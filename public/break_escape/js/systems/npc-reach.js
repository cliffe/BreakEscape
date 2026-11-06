/**
 * Reach to a static-sprite NPC (a patient in a bed, a fixed prop character).
 *
 * Interaction range is normally measured sprite centre to sprite centre. That
 * works for walking NPCs, whose collision body is a small box at the feet. A
 * static NPC's body can cover half or all of a large sprite, and the player's
 * own body sits 31px below its sprite centre, so from some sides the player is
 * stopped by collision before the centres get within range (m02's Mr Pryce in
 * Bed 4, approached from the north, stays about 36px away against a 32px range).
 *
 * For static NPCs the reach is also measured from the player's body centre to
 * the nearest point of the NPC's collision body, and the smaller measure wins.
 * Walking NPCs keep the centre measure, so nothing becomes reachable across a
 * counter or a wall that was not reachable before.
 */

/**
 * Squared distance from (x, y) to the nearest point of a rectangle.
 */
export function pointToRectDistSq(x, y, left, top, width, height) {
    const nx = Math.max(left, Math.min(x, left + width));
    const ny = Math.max(top, Math.min(y, top + height));
    const dx = x - nx;
    const dy = y - ny;
    return dx * dx + dy * dy;
}

/**
 * Squared distance from the player's body centre to the nearest edge of a
 * static NPC's collision body, or null when the sprite is not a static NPC
 * (or has no body).
 */
export function staticNpcBodyDistSq(player, npcSprite) {
    if (!player || !npcSprite || !npcSprite._staticNpc) return null;
    const body = npcSprite.body;
    if (!body || !(body.width > 0) || !(body.height > 0)) return null;
    const pc = player.body?.center;
    const px = pc && Number.isFinite(pc.x) ? pc.x : player.x;
    const py = pc && Number.isFinite(pc.y) ? pc.y : player.y;
    return pointToRectDistSq(px, py, body.x, body.y, body.width, body.height);
}

/**
 * The squared distance to use for an NPC range check: the caller's usual
 * measure, or the body-edge measure for a static NPC when that is smaller.
 * @param {Object} player - player sprite
 * @param {Object} npcSprite - NPC sprite
 * @param {number} baseDistSq - the caller's usual squared distance
 */
export function npcReachDistSq(player, npcSprite, baseDistSq) {
    const edge = staticNpcBodyDistSq(player, npcSprite);
    return edge === null ? baseDistSq : Math.min(baseDistSq, edge);
}
