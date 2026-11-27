/**
 * The 8 compass facings, clockwise from south, and the angle maths for turning one into a
 * direction. One copy for seating.js and npc-needs.js (a needsHome `facing` is read by both).
 */
export const COMPASS8 = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];

/** Angle in radians for a facing, 0 = east and +y = south (screen space); null for an unknown name. */
export function compassAngleRad(facing) {
    const i = COMPASS8.indexOf(facing);
    return i < 0 ? null : (90 - i * 45) * Math.PI / 180;
}

/** A point `dist` px from `from` along a facing, or null for an unknown name or no `from`. */
export function facingPointFrom(from, facing, dist = 64) {
    const a = compassAngleRad(facing);
    if (a === null || !from) return null;
    return { x: from.x + Math.round(Math.cos(a) * dist), y: from.y + Math.round(Math.sin(a) * dist) };
}
