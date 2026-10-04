/**
 * Examine: a close look at an object that has nothing else to do. It shows the
 * sprite at twice its on-screen room size with the object's name, observations
 * and text.
 *
 * Opened from handleObjectInteraction (interactions.js) when the interaction has
 * reached the plain "show the observation" step:
 *  - an inventory item whose click has no other action;
 *  - a room object that is not takeable and whose only content is its
 *    observations or text.
 * Every object with a real action (minigame, phone, notes, readable text,
 * container, lock, pickup, triggerOnInteract) returned before that step.
 *
 * Only imports the forced-minigame guard, so it can be tested in isolation.
 */
import { inventoryBlockedByForcedMinigame } from './forced-minigame-guard.js';

// The examine view shows an object at twice the size the player sees it in the
// room, as a whole-number multiple of its source pixels, and never below 4x.
export const EXAMINE_FACTOR = 2;
export const EXAMINE_MIN_SCALE = 4;

/** Whole-number pixel scale for the examine view, from the room's display scale. */
export function examineScale(displayScale) {
    const d = Number(displayScale);
    const doubled = Number.isFinite(d) && d > 0 ? Math.round(d * EXAMINE_FACTOR) : 0;
    return Math.max(EXAMINE_MIN_SCALE, doubled);
}

/** Display size of a sprite in the examine view, given the room's display scale. */
export function examineDisplaySize(width, height, displayScale) {
    const scale = examineScale(displayScale);
    const w = Math.max(0, Math.round(Number(width) || 0));
    const h = Math.max(0, Math.round(Number(height) || 0));
    return { width: w * scale, height: h * scale, scale };
}

/**
 * How many screen pixels one source pixel takes in the room: the canvas's CSS
 * width over its game width (Phaser scale zoom), times the main camera's zoom.
 */
export function roomDisplayScale(scene) {
    const canvas = scene?.sys?.game?.canvas ?? scene?.game?.canvas;
    const cssWidth = canvas?.getBoundingClientRect?.().width;
    const cssRatio = canvas?.width && cssWidth ? cssWidth / canvas.width : 1;
    const zoom = scene?.cameras?.main?.zoom || 1;
    return cssRatio * zoom;
}

const hasText = (s) => typeof s === 'string' && s.trim().length > 0;

// The key ring keeps its own inventory behaviour (it lists its keys). A single key is examined.
const KEEP_CURRENT = new Set(['key_ring']);

/**
 * Should this interaction open examine instead of the observation notification?
 * Call only at the end of handleObjectInteraction, once every action branch has
 * had its turn.
 *
 * @param {object} data - the object's scenarioData
 * @param {object} opts
 * @param {boolean} opts.inInventory - clicked from the inventory bar
 * @param {string|null} opts.resolvedText - text after textVariants
 * @param {string|null} opts.resolvedObservations - observations after variants
 */
export function shouldExamine(data, { inInventory = false, resolvedText = null, resolvedObservations = null } = {}) {
    if (!data) return false;
    if (KEEP_CURRENT.has(data.type)) return false;
    // Readable text has its own paths: notes page, readDisplay modal, notepad copy.
    if (data.readable && hasText(resolvedText)) return false;
    // The author chose the dialog, or the deprecated onInteract path owns the display.
    if (data.observationDisplay === 'gameDisplay') return false;
    if (data.onInteract) return false;
    if (data.locked === true) return false;
    if (inInventory) return true;
    // A takeable object in the room is picked up, not examined.
    if (data.takeable) return false;
    return hasText(resolvedObservations) || hasText(resolvedText);
}

/**
 * The image to show and its own pixel size. Inventory items are <img> elements;
 * room objects are Phaser sprites, read from their current frame so sprite
 * variants and atlas frames show what the player actually sees.
 */
export function examineImageSource(sprite, deps = {}) {
    if (!sprite) return { src: null, width: 0, height: 0 };
    const isImg = typeof sprite.src === 'string' && sprite.src.length > 0;
    if (isImg) {
        return { src: sprite.src, width: sprite.naturalWidth || 0, height: sprite.naturalHeight || 0 };
    }
    const key = sprite.texture?.key;
    const frame = sprite.frame;
    const textures = deps.textures ?? sprite.scene?.textures;
    let src = null;
    if (key && textures?.getBase64) {
        try { src = textures.getBase64(key, frame?.name); } catch (e) { src = null; }
    }
    if (!src && key) src = `/break_escape/assets/objects/${key}.png`;
    return {
        src,
        width: frame?.cutWidth || frame?.width || 0,
        height: frame?.cutHeight || frame?.height || 0
    };
}

/** Open the examine minigame. Returns true if it opened. */
export function startExamine(sprite, { observations = null, text = null } = {}, deps = {}) {
    const framework = deps.framework ?? (typeof window !== 'undefined' ? window.MinigameFramework : null);
    if (!framework?.registeredScenes?.examine) return false;
    // Never replace a forced (disableClose) minigame such as the debrief.
    if (inventoryBlockedByForcedMinigame({ framework })) return false;
    const data = sprite?.scenarioData || {};
    const image = examineImageSource(sprite, deps);
    const scene = deps.scene ?? sprite?.scene ?? (typeof window !== 'undefined' ? window.game : null);
    const displayScale = deps.displayScale ?? roomDisplayScale(scene);
    framework.startMinigame('examine', null, {
        title: data.name || sprite?.name || 'Examine',
        itemName: data.name || sprite?.name || '',
        observations: hasText(observations) ? observations : '',
        text: hasText(text) ? text : '',
        imageSrc: image.src,
        imageWidth: image.width,
        imageHeight: image.height,
        displayScale,
        itemType: data.type || null,
        itemId: data.id || null,
        showCancel: true,
        cancelText: 'Close'
    });
    return true;
}
