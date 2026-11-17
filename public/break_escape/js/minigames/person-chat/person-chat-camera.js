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
 * The one pixel scale a speaker is drawn at. A source pixel must cover a whole number of
 * canvas pixels, or its neighbours come out 5 and 6 px wide and the edges shimmer as the
 * frame changes. So the contain fit is rounded down to an integer (at least 1) and a
 * close-up's zoom is applied to that integer and rounded again. Only a canvas smaller than
 * the frame (the small self-view on a phone) falls back to the exact fractional fit, since
 * it cannot be drawn at 1x without cropping.
 * @param {number} fit - the contain fit, canvas size over source size (may be fractional)
 * @param {number} [zoom] - the shot's zoom (1 = fit)
 * @returns {number}
 */
export function shotScale(fit, zoom = 1) {
    if (!(fit > 0)) return 1;
    const z = zoom || 1;
    if (fit < 1) return fit * z;
    return Math.max(1, Math.round(Math.floor(fit + 1e-9) * z));
}

/**
 * The contain fit a speaker's frame box gets on a canvas, before it is rounded down to a
 * whole number. On a canvas taller than wide (a phone) the height decides and the sides are
 * cropped, as the old cover framing did, so the character keeps her size instead of
 * shrinking to the narrow width. Elsewhere it is the usual contain fit.
 * @returns {number}
 */
export function containFit(canvasW, canvasH, refW, refH) {
    if (canvasH > canvasW) return canvasH / refH;
    return Math.min(canvasW / refW, canvasH / refH);
}

/**
 * Where to draw a portrait frame, before any flip: contain-fitted at one integer scale
 * (shotScale), scaled by the view's zoom, and moved away from the way it faces by `shift`
 * of the canvas width. A close-up keeps the head near the top instead of centring the frame.
 * Positions are whole canvas pixels.
 *
 * `refW`/`refH` are the largest frame the speaker has (idle image, talk sheet cell, viseme
 * column). The scale comes from that box, so every frame of one speaker gets the same scale;
 * a smaller frame is centred horizontally in the box and sits on its bottom edge.
 * @param {{zoom:number}|null} view
 * @param {number} srcW
 * @param {number} srcH
 * @param {number} canvasW
 * @param {number} canvasH
 * @param {number} shift - share of the canvas width
 * @param {number} [refW] - defaults to srcW
 * @param {number} [refH] - defaults to srcH
 * @param {number|null} [fit] - a fixed contain fit that replaces the one worked out from the canvas
 *   (the phone layout passes the viewport's whole scale, so the canvas height never changes it)
 * @returns {{x:number, y:number, w:number, h:number, scale:number}}
 */
export function portraitRect(view, srcW, srcH, canvasW, canvasH, shift, refW = srcW, refH = srcH, fit = null) {
    const zoom = view?.zoom || 1;
    const scale = shotScale(fit > 0 ? fit : containFit(canvasW, canvasH, refW, refH), zoom);
    const w = srcW * scale;
    const h = srcH * scale;
    const boxW = refW * scale;
    const boxH = refH * scale;
    // When the box is wider than the canvas (a tall tablet, where the scale is led by the
    // height) the full look-away shift would push the figure off the edge, so it shrinks in
    // proportion to how much of the box the canvas shows.
    const shiftPx = canvasW * shift * Math.min(1, canvasW / boxW);
    const x = Math.round((canvasW - boxW) / 2 - shiftPx + (boxW - w) / 2);
    // The box stands on the canvas bottom (never centred, which left a gap under her feet).
    // A close-up crops a little off the top to keep the head in shot, but its bottom still
    // reaches the canvas bottom.
    const boxY = zoom > 1
        ? Math.max(0 - CLOSE_UP_TOP_CROP * boxH, canvasH - boxH)
        : canvasH - boxH;
    const y = Math.round(boxY + (boxH - h));
    return { x, y, w, h, scale };
}

/**
 * Where to draw the background: the same integer scale as the portrait (pass the portrait's
 * unrounded contain fit as `scale`), raised to the next whole number only when that would
 * leave the canvas uncovered. Positions are whole canvas pixels. With `fractionalCover`
 * (scene shots) the scale is the exact cover scale (or `scale`, if larger) instead.
 * On a wide, short canvas at devicePixelRatio 1 the cover step can be one whole number above
 * the sprite's scale (844x390: sprite 2x, background 3x), so the background's pixels are
 * coarser than the sprite's there. Both stay whole-pixel, so nothing shimmers.
 * With `anchorH` (phones: the fixed portrait height, canvas px) the room is placed as if the
 * canvas were that tall and then moved down by the extra height, so it keeps one distance
 * from the speaker, who stands on the canvas bottom, while the room has height to spare.
 * The result is clamped so the image still covers the canvas, so once the growth uses up
 * that spare height (the 1x floor on short DPR 1 windows, under about 640 px) the room
 * stops moving down and the speaker slides against it.
 */
export function backgroundRect(view, scale, imgW, imgH, canvasW, canvasH, fractionalCover = false, anchorH = 0) {
    // A scene shot has no animated sprite to match, so it may use the exact cover scale
    // (a whole-number one would crop much more of the room)
    const cover = fractionalCover
        ? Math.max(canvasW / imgW, canvasH / imgH)
        : Math.ceil(Math.max(canvasW / imgW, canvasH / imgH) - 1e-9);
    const s = fractionalCover ? Math.max(cover, scale) : Math.max(shotScale(scale, view?.zoom || 1), cover);
    const w = imgW * s;
    const h = imgH * s;
    const pan = Math.min(1, Math.max(0, view?.pan ?? 1));
    const x = Math.round(0 - pan * Math.max(0, w - canvasW));
    let y = h > canvasH ? Math.round((canvasH - h) / 2) : 0;
    if (anchorH > 0 && !fractionalCover && h > canvasH) {
        y = Math.round((anchorH - h) / 2) + (canvasH - anchorH);
        y = Math.min(0, Math.max(canvasH - h, y));
    }
    return { x, y, w, h };
}

/**
 * Canvas backing size for a CSS box: one backing pixel per device pixel, so the browser
 * shows the canvas 1:1 and never resamples it (a backing store that is stretched by a
 * non-integer factor gives pixels of uneven width).
 * @param {number} cssW
 * @param {number} cssH
 * @param {number} [dpr]
 * @returns {{width:number, height:number}}
 */
export function canvasBackingSize(cssW, cssH, dpr = 1) {
    const d = dpr > 0 ? dpr : 1;
    return {
        width: Math.max(1, Math.round(cssW * d)),
        height: Math.max(1, Math.round(cssH * d))
    };
}

/** Side of the portrait frame the phone layout sizes for (idle image, talk cell, viseme column). */
export const PHONE_FRAME_PX = 128;
/** The least caption height (CSS px) a phone keeps for the speaker line and two choices. */
export const PHONE_MIN_CAPTION_PX = 330;

/**
 * The phone portrait section, sized from the viewport and nothing else. It takes the largest
 * whole pixel scale that still leaves `minCaption` CSS px for the caption below it, and its
 * height is exactly what that scale needs (scale x frame, in device pixels), so there is no
 * spare band above the speaker. The scale never depends on the line or the choices on screen,
 * only on the box the chat sits in and the device pixel ratio.
 * @param {number} boxH - height of the chat box, CSS px
 * @param {number} [dpr]
 * @param {number} [frame] - source frame side, px
 * @param {number} [minCaption] - CSS px to keep for the caption
 * @returns {{scale:number, cssHeight:number}} cssHeight is in CSS px
 */
export function phonePortraitSize(boxH, dpr = 1, frame = PHONE_FRAME_PX, minCaption = PHONE_MIN_CAPTION_PX) {
    const d = dpr > 0 ? dpr : 1;
    const scale = Math.max(1, Math.floor(((boxH - minCaption) * d) / frame + 1e-9));
    // a hair over, so layout rounding to device pixels never drops the backing below scale x frame
    return { scale, cssHeight: (scale * frame) / d + 0.01 };
}
