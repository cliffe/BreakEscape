/**
 * Where the camera sits on a person-chat background for each speaker.
 *
 * The background is drawn at the portrait's pixel scale, so only part of it
 * shows at once. The player gets the left of the room and the first NPC to
 * speak gets the right, as in a two-hander. Every later NPC gets a middle
 * shot with the NPC centred, still facing the player: either a wide shot of
 * the middle of the room, or a close-up that scales the NPC and the background
 * together, so their pixels always stay the same size. The middle shots
 * alternate and each has its own pan, so two in a row never show the same frame.
 *
 * A view is { pan, zoom, shift }:
 *   pan   - 0 shows the background's left edge, 1 its right edge
 *   zoom  - scale of portrait and background on top of the portrait's fit (1 = fit)
 *   shift - how far the portrait moves away from the way it faces, as a share
 *           of the canvas width (0.2 is the usual look-away; 0 centres it)
 */

export const PLAYER_VIEW = Object.freeze({ pan: 0, zoom: 1, shift: 0.2 });
export const FIRST_NPC_VIEW = Object.freeze({ pan: 1, zoom: 1, shift: 0.2 });

const MIDDLE_VIEWS = Object.freeze([
    { pan: 0.5, zoom: 1.5, shift: 0 },
    { pan: 0.4, zoom: 1, shift: 0 },
    { pan: 0.62, zoom: 1.5, shift: 0 },
    { pan: 0.6, zoom: 1, shift: 0 },
    { pan: 0.38, zoom: 1.5, shift: 0 }
].map(Object.freeze));

// In a close-up, the share of the portrait cut off above the frame (keeps the head in shot)
const CLOSE_UP_TOP_CROP = 0.03;

/**
 * @param {boolean} isPlayer
 * @param {number} slot - the NPC's order of first speaking in this conversation (0-based)
 * @returns {{pan:number, zoom:number, shift:number}}
 */
export function cameraViewFor(isPlayer, slot = 0) {
    if (isPlayer) return PLAYER_VIEW;
    if (!Number.isInteger(slot) || slot <= 0) return FIRST_NPC_VIEW;
    return MIDDLE_VIEWS[(slot - 1) % MIDDLE_VIEWS.length];
}

/**
 * Where to draw a portrait frame, before any flip: contain-fitted, scaled by the
 * view's zoom, and moved away from the way it faces by `shift` of the canvas width.
 * A close-up keeps the head near the top instead of centring the frame.
 * @param {{zoom:number}|null} view
 * @param {number} srcW
 * @param {number} srcH
 * @param {number} canvasW
 * @param {number} canvasH
 * @param {number} shift - share of the canvas width
 * @returns {{x:number, y:number, w:number, h:number, scale:number}}
 */
export function portraitRect(view, srcW, srcH, canvasW, canvasH, shift) {
    const zoom = view?.zoom || 1;
    const scale = Math.min(canvasW / srcW, canvasH / srcH) * zoom;
    const w = srcW * scale;
    const h = srcH * scale;
    const x = (canvasW - w) / 2 - canvasW * shift;
    const y = zoom > 1 ? 0 - CLOSE_UP_TOP_CROP * h : (canvasH - h) / 2;
    return { x, y, w, h, scale };
}

export function backgroundRect(view, scale, imgW, imgH, canvasW, canvasH) {
    const s = scale * (view?.zoom || 1);
    const w = imgW * s;
    const h = imgH * s;
    const pan = Math.min(1, Math.max(0, view?.pan ?? 1));
    const x = 0 - pan * Math.max(0, w - canvasW);
    const y = h > canvasH ? (canvasH - h) / 2 : 0;
    return { x, y, w, h };
}
