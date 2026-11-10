// Desk collision boxes from the floor footprint (docs/achitechture/SEAT_BOX_PLAN.md, slice 2).
//
// A desk's body has always been the bottom quarter of its sprite, inset 10 px each side. That
// lets a chair (or a walker) stop inside the desk's floor footprint. A map can opt in to
// footprint boxes with a Tiled map property, deskBoxes = "footprint"; the box then runs from
// F - foot to F (F being the floor line) across the desk's opaque width, using the per-texture
// data in assets/table_surfaces.json. Maps that don't opt in keep today's box for good.
//
// Pure functions only: rooms.js hands in the sprite, the parsed JSON and the mode.

export const DESK_BOX_FOOTPRINT = 'footprint';
export const DESK_BOX_LEGACY = 'legacy';

/**
 * A Tiled map property. Tiled 1.2+ writes `properties` as an array of
 * { name, type, value }; hand-written maps may use a plain object. Returns null when the
 * map has no properties or not this one.
 * @param {object} tilemap - a Phaser tilemap (or the raw map JSON); either has `properties`
 * @param {string} name
 */
export function mapProperty(tilemap, name) {
    const props = tilemap?.properties;
    if (!props) return null;
    if (Array.isArray(props)) {
        const hit = props.find((p) => p && p.name === name);
        return hit && hit.value !== undefined ? hit.value : null;
    }
    if (typeof props === 'object' && Object.prototype.hasOwnProperty.call(props, name)) {
        return props[name] ?? null;
    }
    return null;
}

/**
 * The desk box mode for a room: the test override wins, then the map property.
 * Any value other than "footprint" means legacy.
 * @param {object} tilemap
 * @param {string|undefined} override - window.__deskBoxes ('legacy' | 'footprint')
 */
export function deskBoxModeFor(tilemap, override) {
    if (override === DESK_BOX_FOOTPRINT || override === DESK_BOX_LEGACY) return override;
    return mapProperty(tilemap, 'deskBoxes') === DESK_BOX_FOOTPRINT ? DESK_BOX_FOOTPRINT : DESK_BOX_LEGACY;
}

/**
 * The footprint box for a desk sprite, in sprite px ({ x, y, w, h }, ready for
 * body.setSize / setOffset), or null when the texture has no `foot`, is listed in
 * `legacyBox`, or the sprite is rotated or scaled (static bodies don't follow scale, and
 * no tables-layer object is scaled or rotated today).
 * @param {object} sprite - needs texture.key, width, height; flipX, rotation, scaleX, scaleY read if set
 * @param {object} data - parsed table_surfaces.json
 */
export function deskBoxOf(sprite, data) {
    const key = sprite?.texture?.key;
    if (!key || !data || !data.sprites) return null;
    if (Array.isArray(data.legacyBox) && data.legacyBox.includes(key)) return null;
    const entry = data.sprites[key];
    if (!entry || !(Number(entry.foot) > 0)) return null;
    if (sprite.rotation) return null;
    if ((sprite.scaleX ?? 1) !== 1 || (sprite.scaleY ?? 1) !== 1) return null;

    const w = sprite.width;
    const h = sprite.height;
    const floor = Number.isFinite(entry.floor) ? entry.floor : h;
    let [x0, x1] = Array.isArray(entry.x) ? entry.x : [0, w];
    if (sprite.flipX) [x0, x1] = [w - x1, w - x0];
    const foot = Math.min(entry.foot, floor);
    return { x: x0, y: floor - foot, w: x1 - x0, h: foot };
}

/** Today's box: the bottom quarter, inset 10 px each side. */
export function legacyTableBox(sprite) {
    const w = sprite.width;
    const h = sprite.height;
    return { x: 10, y: h - h / 4, w: w - 20, h: h / 4 };
}

/**
 * The box applyTableBody gives a table: the footprint box when the room has opted in and the
 * texture has data, else today's box exactly.
 * @returns {{ x:number, y:number, w:number, h:number, kind:'footprint'|'legacy' }}
 */
export function tableBodyBox(sprite, mode, data) {
    if (mode === DESK_BOX_FOOTPRINT) {
        const box = deskBoxOf(sprite, data);
        if (box) return { ...box, kind: DESK_BOX_FOOTPRINT };
    }
    return { ...legacyTableBox(sprite), kind: DESK_BOX_LEGACY };
}
