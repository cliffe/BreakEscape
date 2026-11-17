/**
 * Engine breathing for one-frame figures (owner decision D24 in docs/achitechture/NPC_POSES.md):
 * the head and shoulders sink 1px and rise again on a slow cycle, at no art cost.
 *
 * Used by seating.js for seated frames and by npc-poses.js for pose frames (drink, use,
 * phone), and, opt-in, for standing idles. The seated frames and pose frames are single
 * PixelLab rotations (breathing-idle is redrawn frame to frame and drawn at another scale,
 * so it can't be reused). While "down", the figure is cropped to the rows below the cut and
 * an image of the rows above it is drawn 1px lower, so nothing leaves a gap. Each figure
 * gets its own phase. Off under reduced motion and for sprites with a glow (postFX).
 *
 * No imports: seating.js and npc-poses.js import this module statically, so a JS test
 * harness that copies either file must copy this one too.
 */

export const BREATH_MS = 3600;            // one breath
export const BREATH_DOWN = [0.5, 0.9];    // the part of the cycle with head and shoulders down
export const BREATH_CUT = 0.42;           // share of the figure's height, from the top, that moves
const breathRowsCache = new Map(); // `${texture}|${frame}` -> { top, cut } or null

let reducedMotionQuery;
export function prefersReducedMotion() {
    try {
        if (reducedMotionQuery === undefined) reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') || null;
        return reducedMotionQuery?.matches === true;
    } catch (e) { return false; }
}

/** Opaque top row of a frame and the cut row just under the shoulders. */
export function breathRows(textureKey, frameName) {
    const k = `${textureKey}|${frameName}`;
    if (breathRowsCache.has(k)) return breathRowsCache.get(k);
    let rows = null;
    try {
        const tm = window.game?.textures;
        const frame = tm?.getFrame(textureKey, frameName);
        if (frame && tm.getPixelAlpha) {
            let top = -1, bottom = -1;
            for (let y = 0; y < frame.height; y++) {
                for (let x = 0; x < frame.width; x++) {
                    if (tm.getPixelAlpha(x, y, textureKey, frameName) > 0) { if (top < 0) top = y; bottom = y; break; }
                }
            }
            if (top >= 0 && bottom - top > 8) rows = { top, cut: top + Math.round(BREATH_CUT * (bottom - top)) };
        }
    } catch (e) { /* no breathing for this frame */ }
    breathRowsCache.set(k, rows);
    return rows;
}

/** Pure: is a figure with this phase breathing out (head and shoulders down) at `now` ms? */
export function breathDown(now, phase) {
    const t = ((((now + phase) % BREATH_MS) + BREATH_MS) % BREATH_MS) / BREATH_MS;
    return t >= BREATH_DOWN[0] && t < BREATH_DOWN[1];
}

/**
 * Draw `sprite` breathing (or still, when `on` is false). `holder` keeps the per-figure
 * state ({ img, phase, crop }); endBreath(holder, sprite) when the figure stops (gets up,
 * leaves the pose). The moving image is drawn `depthStep` above the sprite (seating.js:
 * a tenth of its seat depth step).
 */
export function updateBreath(holder, sprite, on, depthStep = 0.001) {
    if (!holder || !sprite?.active) return;
    const b = holder.breath || (holder.breath = { img: null, phase: Math.random() * BREATH_MS, crop: null });
    const now = sprite.scene?.time?.now ?? performance.now();
    // A glow (postFX) can't be copied onto the image, so those figures keep still.
    const fx = sprite.postFX?.list?.length > 0;
    const rows = on && !fx && sprite.visible && !prefersReducedMotion()
        ? breathRows(sprite.texture.key, sprite.frame.name) : null;
    if (!rows || !breathDown(now, b.phase)) {
        if (b.img) b.img.setVisible(false);
        if (b.crop) { sprite.setCrop(); b.crop = null; }
        return;
    }
    const w = sprite.frame.width, h = sprite.frame.height;
    const crop = `${sprite.frame.name}|${rows.cut}`;
    if (b.crop !== crop) { sprite.setCrop(0, rows.cut, w, h - rows.cut); b.crop = crop; }
    if (!b.img) {
        b.img = sprite.scene.add.image(0, 0, sprite.texture.key, sprite.frame.name);
        sprite.once('destroy', () => { b.img?.destroy(); b.img = null; });
    }
    const img = b.img;
    if (img.frame.name !== sprite.frame.name || img.texture.key !== sprite.texture.key) img.setTexture(sprite.texture.key, sprite.frame.name);
    img.setCrop(0, 0, w, rows.cut)
        .setOrigin(sprite.originX, sprite.originY)
        .setScale(sprite.scaleX, sprite.scaleY)
        .setFlip(sprite.flipX, sprite.flipY)
        .setPosition(sprite.x, sprite.y + sprite.scaleY)
        .setAlpha(sprite.alpha)
        .setDepth(sprite.depth + depthStep)
        .setVisible(true);
    if (sprite.isTinted) img.setTint(sprite.tintTopLeft, sprite.tintTopRight, sprite.tintBottomLeft, sprite.tintBottomRight);
    else if (img.isTinted) img.clearTint();
}

export function endBreath(holder, sprite) {
    const b = holder?.breath;
    if (!b) return;
    b.img?.destroy();
    if (b.crop && sprite?.active) sprite.setCrop();
    holder.breath = null;
}
