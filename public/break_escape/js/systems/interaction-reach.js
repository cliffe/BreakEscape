/**
 * INTERACTION REACH
 * =================
 *
 * Reach is measured from the player to the object's position, which for a
 * scenario object is the sprite's top-left corner. That is fine for a 32px
 * prop, but a wide one (the 42px sis_config_panel, a 100px desk) was out of
 * reach for anyone standing under its right half: the measure ran to the left
 * edge, not to the part in front of them.
 *
 * reachX() gives the x to measure to: the player's own x clamped into the
 * object's horizontal span, so standing below any part of it counts as being at
 * that part. The vertical measure is unchanged (the sprite's y), which keeps
 * every existing stand point valid; this only ever shortens a reach.
 *
 * Doors and NPCs keep their own measures (DOOR_INTERACTION_RANGE_SQ,
 * npc-reach.js). No imports, so the node tests can load this file on its own.
 */

/** The x to measure reach to for `sprite`, seen from player x `fromX`. */
export function reachX(sprite, fromX) {
    if (!sprite || !Number.isFinite(sprite.x)) return sprite ? sprite.x : 0;
    if (sprite._isNPC || sprite.doorProperties || !sprite.scenarioData) return sprite.x;
    if (!Number.isFinite(fromX)) return sprite.x;
    // A rotated prop (Tiled rotation, rooms.js) spans its rotated bounds, not
    // width from the origin. Only those pay for getBounds().
    if (sprite.rotation && typeof sprite.getBounds === 'function') {
        try {
            const b = sprite.getBounds();
            if (b && b.width > 0) return Math.max(b.left, Math.min(fromX, b.right));
        } catch (e) { /* fall through to the unrotated span */ }
    }
    const w = sprite.displayWidth ?? sprite.width ?? 0;
    if (!(w > 0)) return sprite.x;
    const left = sprite.x - (sprite.originX ?? 0.5) * w;
    return Math.max(left, Math.min(fromX, left + w));
}

/**
 * The x to aim the facing angle at: the horizontal centre of the object. E-key
 * scoring is mostly angle, and reachX alone would read 0 degrees for any wide
 * object the player stands under, beating a small item beside them. Doors, NPCs
 * and sprites without scenario data keep sprite.x.
 */
export function aimX(sprite) {
    if (!sprite || !Number.isFinite(sprite.x)) return sprite ? sprite.x : 0;
    if (sprite._isNPC || sprite.doorProperties || !sprite.scenarioData) return sprite.x;
    if (sprite.rotation && typeof sprite.getBounds === 'function') {
        try {
            const b = sprite.getBounds();
            if (b && b.width > 0) return b.centerX ?? (b.left + b.width / 2);
        } catch (e) { /* fall through */ }
    }
    const w = sprite.displayWidth ?? sprite.width ?? 0;
    if (!(w > 0)) return sprite.x;
    return sprite.x - (sprite.originX ?? 0.5) * w + w / 2;
}
