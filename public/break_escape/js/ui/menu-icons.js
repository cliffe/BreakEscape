// Icons for the tap's pick-one menu (overlap menu plan, D8): every world sprite in a menu is
// drawn at exactly 2x its own pixels in the 64 x 64 box, so two things in one menu share a
// scale. A frame wider than 32 px keeps its middle columns, one taller than 32 px keeps its
// top rows, a dimension that fits is centred. Offsets are even, so each source pixel stays
// 2 px wide (R4 n2). NPCs show their authored 32 x 32 headshot at 2x, else the pixel
// silhouette. Pixel art is never scaled down or by a fraction.
// Imported by core/game.js only.
import { examineImageSource } from '../systems/examine.js';
import { applyHeadshotBox, headshotSourceFor, SILHOUETTE_URL } from '../utils/npc-headshot.js';
import { openHandIcon } from './interaction-menu.js';

export const ICON_BOX = 64;
const SCALE = 2;
const FILE_FALLBACK = '/break_escape/assets/objects/';

// An even offset that centres `size` in the box (negative when it is wider)
function evenOffset(size) {
    return SCALE * Math.trunc((ICON_BOX - size) / (2 * SCALE));
}

/** Size and position of a frame drawn at 2x: middle columns, top rows. */
export function spriteIconGeometry(frameWidth, frameHeight) {
    const width = frameWidth * SCALE;
    const height = frameHeight * SCALE;
    const x = evenOffset(width);
    const y = height > ICON_BOX ? 0 : evenOffset(height);
    return { width, height, position: `${x + 0}px ${y + 0}px` };
}

const cache = new Map();

/** Forget the cached frame copies (tests). */
export function resetMenuIconCache() { cache.clear(); }

/**
 * The icon for an object, chair or door sprite: its current frame at 2x, copied once per
 * texture key and frame. A frame whose image cannot be copied from a texture with more than
 * one frame (Phaser counts __BASE, so a two-frame sheet is 3) gets the open hand, never the
 * whole sheet.
 */
export function spriteMenuIcon(sprite, deps = {}) {
    if (!sprite) return openHandIcon();
    const key = sprite.texture?.key;
    const frameName = sprite.frame?.name;
    const cacheKey = key ? `${key}|${frameName}` : null;
    if (cacheKey && cache.has(cacheKey)) return cache.get(cacheKey);
    const image = examineImageSource(sprite, deps);
    let icon;
    const frameTotal = sprite.texture?.frameTotal ?? 1;
    if (!image.src || !image.width || !image.height) icon = openHandIcon();
    else if (image.src.startsWith(FILE_FALLBACK) && frameTotal > 2) icon = openHandIcon();
    else icon = { src: image.src, ...spriteIconGeometry(image.width, image.height) };
    if (cacheKey) cache.set(cacheKey, icon);
    return icon;
}

/**
 * The icon for an NPC: draws into the menu's icon box itself. The authored headshot is
 * 32 x 32, shown at 64 x 64; with none, the box is unhidden and shows the silhouette at
 * the same size.
 */
export function npcMenuIcon(sprite, deps = {}) {
    const manager = deps.npcManager ?? (typeof window !== 'undefined' ? window.npcManager : null);
    const record = sprite?.npcId ? (manager?.getNPC?.(sprite.npcId) || null) : null;
    const source = record ? headshotSourceFor({}, record) : { spriteSheet: sprite?.texture?.key || null };
    const size = `${ICON_BOX}px ${ICON_BOX}px`;
    return {
        headshot: source,
        apply(box) {
            const opts = {
                onResult(result) {
                    if (result) {
                        box.style.backgroundSize = size;
                        box.style.backgroundPosition = '0px 0px';
                        return;
                    }
                    box.hidden = false;
                    box.style.backgroundImage = `url("${SILHOUETTE_URL}")`;
                    box.style.backgroundRepeat = 'no-repeat';
                    box.style.backgroundSize = size;
                    box.style.backgroundPosition = '0px 0px';
                    box.dataset.frame = 'silhouette';
                }
            };
            if (deps.ImageCtor !== undefined) opts.ImageCtor = deps.ImageCtor;
            if (deps.onMissing !== undefined) opts.onMissing = deps.onMissing;
            applyHeadshotBox(box, source, opts);
        }
    };
}

/**
 * Each entry's icon spec for the tap menu, by its kind: objects and doors from their
 * sprite, NPCs from their headshot. An entry with no sprite keeps its own icon (null).
 */
export function menuIconsFor(entries, deps = {}) {
    return (entries || []).map(e => {
        if (!e?.sprite) return null;
        if (e.kind === 'npc') return npcMenuIcon(e.sprite, deps);
        return spriteMenuIcon(e.sprite, deps);
    });
}
