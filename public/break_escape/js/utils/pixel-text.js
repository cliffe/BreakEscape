/**
 * Pixel-accurate text inside the Phaser canvas: GNF as a bitmap font (q105).
 *
 * Canvas text made with scene.add.text rasterises a TTF at sizes that do not land on the game's
 * pixel grid, so it comes out blurred or uneven once the canvas is scaled up. GNF is drawn on a
 * grid (200 font units a pixel, 10.24 px a native em), so tools/fonts/build_gnf_bitmap.py draws
 * every glyph at that native size with anti-aliasing off into a sprite sheet
 * (assets/fonts/gnf-bitmap/gnf.png + .xml; gnf-shadow is each glyph grown by 1 px, all black).
 * Here BitmapText draws from that sheet at a whole-number scale (x1, x2, x3), tinted for colour,
 * placed on whole pixels. Outlined text is a container of two BitmapTexts at the same pen
 * position: the shadow sheet, then the plain sheet tinted on top. The union of the shadows is
 * one outline round the whole string, so where neighbouring glyphs' outlines meet nothing is
 * drawn twice.
 *
 *   preloadPixelFont(scene)                  queue both sheets (the game's preload calls it)
 *   pixelText(scene, x, y, text, opts)       make one; opts { scale, color, origin, wrap, outline, depth }
 *   setPixelText(t, text, anchor?)           change the text, keeping (or moving to) its anchor { x, y }
 *   placePixelText(t, x, y)                  move its anchor
 *   setPixelColour(t, colour)                change the fill colour (any kind of pixel text)
 *   setPixelScale(t, scale)                  change the whole-number scale, keeping the anchor
 *   pixelTextBox(t)                          { left, top, width, height } of what it draws, in px
 *
 * `origin` [ox, oy] anchors the text's box at (x, y) as setOrigin would, but the box's top left is
 * rounded to a whole pixel and the BitmapText itself keeps origin 0, so a centred odd-width word
 * never sits on half a pixel. The box is the ink's left and right edges and the line box's top
 * and bottom (9 rows above the baseline, 2 below), so a word without capitals does not jump.
 * Multi-line text is left-aligned; centre one line at a time with origin.
 *
 * Before the sheets are in the scene's cache (or with no bitmapText, as in node tests) pixelText
 * falls back to a canvas Text in the GNF web font at the same size, flagged pixelFallback.
 */

export const PIXEL_FONT = 'gnf';
export const PIXEL_FONT_SHADOW = 'gnf-shadow';
export const PIXEL_FONT_PATH = 'fonts/gnf-bitmap/';
// The XML's info size and lineHeight: BitmapText draws at fontSize / size, so fontSize is this
// times the whole-number scale
export const PIXEL_FONT_SIZE = 12;
export const PIXEL_LINE_HEIGHT = 12;
export const PIXEL_ASCENT = 9;             // line box rows above the baseline
export const PIXEL_DESCENT = 2;            // and below it
export const PIXEL_LINE_BOX = PIXEL_ASCENT + PIXEL_DESCENT;
export const GNF_NATIVE_EM = 10.24;        // px per em at one font pixel per screen pixel

// Characters the font does not have, drawn as the nearest letters it does have
const STAND_INS = {
    'ł': 'l', 'Ł': 'L', 'æ': 'ae', 'Æ': 'AE', 'œ': 'oe', 'Œ': 'OE', 'ð': 'd', 'Ð': 'D', 'þ': 'th', 'Þ': 'Th',
    'ø': 'o', 'Ø': 'O', '✗': 'x', '¤': '$', '−': '-', ' ': ' ', '\t': ' '
};

/** Whole-number scale, at least 1. */
export function pixelScale(s) {
    const n = Math.round(Number(s) || 1);
    return n < 1 ? 1 : n;
}

/** '#rrggbb', 'rrggbb' or a number to a number (null stays null). */
export function colourInt(c) {
    if (c === null || c === undefined || c === '') return null;
    if (typeof c === 'number') return c;
    const m = String(c).trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    return parseInt(h, 16);
}

/**
 * Pure: `text` with every character the font lacks swapped for one it has: the letter without
 * its accent, a stand-in from STAND_INS, else '?'. `chars` is the font's chars map (code -> glyph).
 */
export function pixelSafe(text, chars) {
    const s = String(text ?? '');
    if (!chars) return s;
    let out = '';
    for (const ch of s) {
        if (ch === '\n' || chars[ch.codePointAt(0)]) { out += ch; continue; }
        const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (base && base !== ch && [...base].every(b => chars[b.codePointAt(0)])) { out += base; continue; }
        const sub = STAND_INS[ch];
        if (sub !== undefined && [...sub].every(b => chars[b.codePointAt(0)])) { out += sub; continue; }
        out += chars[63] ? '?' : '';
    }
    return out;
}

/**
 * Pure: the box a text draws, in font pixels before scale, from the font's chars map. x from the
 * ink's left to its right edge; y the line box (top of the first line to the bottom of the last).
 * Outline sheets grow every edge by 1. Returns { left, right, top, bottom, lines }.
 */
export function measurePixelText(chars, text, { lineHeight = PIXEL_LINE_HEIGHT, outline = false } = {}) {
    const lines = String(text ?? '').split('\n');
    let left = Infinity, right = -Infinity;
    for (const line of lines) {
        let pen = 0;
        for (const ch of line) {
            const g = chars?.[ch.codePointAt(0)];
            if (!g) continue;
            if (g.width > 0) {
                left = Math.min(left, pen + g.xOffset);
                right = Math.max(right, pen + g.xOffset + g.width);
            }
            pen += g.xAdvance;
        }
    }
    if (left === Infinity) { left = 0; right = 0; }
    const o = outline ? 1 : 0;
    return { left, right, top: outline ? -1 : 0, bottom: (lines.length - 1) * lineHeight + PIXEL_LINE_BOX + o, lines: lines.length };
}

/** Pure: the width of one line's ink, in font pixels before scale. */
function lineWidth(chars, line, outline) {
    const m = measurePixelText(chars, line, { outline });
    return m.right - m.left;
}

/**
 * Pure: word-wrap so no line's ink is wider than `maxPx` screen pixels at `scale`; a word wider
 * than that gets a line of its own. Existing line breaks are kept.
 */
export function wrapPixelText(chars, text, maxPx, { scale = 1, outline = false } = {}) {
    const limit = maxPx / pixelScale(scale);
    const out = [];
    for (const para of String(text ?? '').split('\n')) {
        const words = para.split(/ +/).filter(Boolean);
        let cur = '';
        for (const w of words) {
            const next = cur ? `${cur} ${w}` : w;
            if (!cur || lineWidth(chars, next, outline) <= limit) cur = next;
            else { out.push(cur); cur = w; }
        }
        out.push(cur);
    }
    return out.join('\n');
}

/** The font's data (chars map, lineHeight) in this scene's cache, or null; `outline` the shadow sheet's. */
export function pixelFontData(scene, outline = false) {
    try {
        const e = scene?.cache?.bitmapFont?.get?.(outline ? PIXEL_FONT_SHADOW : PIXEL_FONT);
        return e?.data?.chars ? e.data : null;
    } catch (e) { return null; }
}

/** Can this scene draw pixel text now? Outlined text needs both sheets and a container. */
export function pixelFontReady(scene, outline = false) {
    if (!scene?.add?.bitmapText || !pixelFontData(scene)) return false;
    return !outline || !!(scene.add.container && pixelFontData(scene, true));
}

/** Pure: the sheet's URLs, versioned so a rebuilt XML never pairs with a cached old PNG. */
export function pixelFontUrls(key, version = null) {
    const v = version ?? globalThis.window?.breakEscapeConfig?.assetsVersion ?? null;
    const q = v ? `?v=${encodeURIComponent(v)}` : '';
    return [`${PIXEL_FONT_PATH}${key}.png${q}`, `${PIXEL_FONT_PATH}${key}.xml${q}`];
}

/** Queue both sheets on the scene's loader (in preload, or with start() after it). */
export function preloadPixelFont(scene, { start = false, version = null } = {}) {
    const load = scene?.load;
    if (!load?.bitmapFont) return false;
    let queued = false;
    for (const key of [PIXEL_FONT, PIXEL_FONT_SHADOW]) {
        if (scene.cache?.bitmapFont?.exists?.(key)) continue;
        load.bitmapFont(key, ...pixelFontUrls(key, version));
        queued = true;
    }
    if (queued && start && !load.isLoading?.()) load.start();
    return queued;
}

const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;

function fallbackStyle(scale, color, outline, wrap) {
    const style = { fontFamily: "'GNF', monospace", fontSize: `${GNF_NATIVE_EM * scale}px`, color: color == null ? '#ffffff' : hex(color) };
    if (outline) { style.stroke = '#000000'; style.strokeThickness = 2 * scale; }
    // `wrap` means the same on both paths: a width in screen pixels, breaking at spaces
    if (wrap > 0) style.wordWrap = { width: wrap };
    return style;
}

/** Make a pixel text. See the file comment for opts. */
export function pixelText(scene, x, y, text, opts = {}) {
    const scale = pixelScale(opts.scale);
    const outline = !!opts.outline;
    const color = colourInt(opts.color);
    const wrap = opts.wrap || 0;
    const origin = Array.isArray(opts.origin) ? opts.origin : [opts.origin ?? 0, opts.origin ?? 0];
    let t;
    if (pixelFontReady(scene, outline)) {
        const fill = scene.add.bitmapText(0, 0, PIXEL_FONT, '', PIXEL_FONT_SIZE * scale);
        fill.setOrigin?.(0, 0);
        if (color != null) fill.setTint?.(color);
        if (outline) {
            // Shadow first (drawn behind), then the tinted fill at the same pen position
            const shadow = scene.add.bitmapText(0, 0, PIXEL_FONT_SHADOW, '', PIXEL_FONT_SIZE * scale);
            shadow.setOrigin?.(0, 0);
            t = scene.add.container(0, 0, [shadow, fill]);
            t.pixelParts = [shadow, fill];
            t.pixelFont = pixelFontData(scene, true);
        } else {
            t = fill;
            t.pixelParts = [fill];
            t.pixelFont = pixelFontData(scene);
        }
        t.pixelFill = fill;
    } else {
        t = scene.add.text(0, 0, '', fallbackStyle(scale, color, outline, wrap));
        t.setOrigin?.(origin[0], origin[1]);
        t.pixelFallback = true;
    }
    t.pixelOpts = { scale, outline, origin, wrap };
    t.pixelAnchor = { x, y };
    t.pixelColour = color;
    if (opts.depth !== undefined) t.setDepth?.(opts.depth);
    setPixelText(t, text);
    return t;
}

/** Change the fill colour of any pixel text (a tint on the sheet, the style colour on the fallback). */
export function setPixelColour(t, colour) {
    const c = colourInt(colour);
    if (c == null || t.pixelColour === c) return t;
    t.pixelColour = c;
    if (t.pixelFallback) t.setColor?.(hex(c));
    else t.pixelFill?.setTint?.(c);
    return t;
}

/** The box a pixel text draws, in screen px relative to its anchor's top left ({ left, top, width, height }). */
export function pixelTextBox(t) {
    const { scale, outline } = t.pixelOpts;
    if (!t.pixelFont) {
        const w = Math.ceil(t.width || 0), h = Math.ceil(t.height || 0);
        return { left: 0, top: 0, width: w, height: h };
    }
    const m = measurePixelText(t.pixelFont.chars, t.pixelShown ?? '', { lineHeight: t.pixelFont.lineHeight || PIXEL_LINE_HEIGHT, outline });
    return { left: m.left * scale, top: m.top * scale, width: (m.right - m.left) * scale, height: (m.bottom - m.top) * scale };
}

/**
 * Change the text (swapping glyphs the font lacks and wrapping), keeping the anchor, or moving
 * it first when `anchor` ({ x, y }) is given.
 */
export function setPixelText(t, text, anchor = null) {
    const { scale, outline, wrap } = t.pixelOpts;
    if (anchor) t.pixelAnchor = { x: anchor.x, y: anchor.y };
    let s = String(text ?? '');
    if (t.pixelFont) {
        s = pixelSafe(s, t.pixelFont.chars);
        if (wrap > 0) s = wrapPixelText(t.pixelFont.chars, s, wrap, { scale, outline });
    }
    t.pixelShown = s;
    if (t.pixelParts) for (const p of t.pixelParts) p.setText(s);
    else t.setText(s);
    return placePixelText(t, t.pixelAnchor.x, t.pixelAnchor.y);
}

/** Change the whole-number scale (a stepped pulse in place of a smooth scale tween), keeping the anchor. */
export function setPixelScale(t, scale) {
    const s = pixelScale(scale);
    if (t.pixelOpts.scale === s) return t;
    t.pixelOpts.scale = s;
    if (t.pixelParts) for (const p of t.pixelParts) p.setFontSize?.(PIXEL_FONT_SIZE * s);
    else t.setFontSize?.(`${GNF_NATIVE_EM * s}px`);
    return setPixelText(t, t.pixelShown ?? '');
}

/** Move the anchor; the drawn box's top left lands on a whole pixel. */
export function placePixelText(t, x, y) {
    t.pixelAnchor = { x, y };
    const [ox, oy] = t.pixelOpts.origin;
    if (!t.pixelFont) { t.setPosition(Math.round(x), Math.round(y)); return t; }
    const b = pixelTextBox(t);
    t.setPosition(Math.round(x - ox * b.width) - b.left, Math.round(y - oy * b.height) - b.top);
    return t;
}
