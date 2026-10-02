/**
 * Art slots for the fingerprint minigame.
 *
 * Every slot has a fixed size and a fixed path. If a PNG exists at that path it is used (nearest-neighbour,
 * so pixel art stays crisp); otherwise the slot is drawn procedurally, so the minigame is complete without
 * any image files. Drop a PNG of the right size at the path and it replaces the fallback on the next open.
 *
 * Paths are under /break_escape/assets/minigames/fingerprint/<name>.png.
 *
 * @module dusting-art
 */
import { mulberry32 } from './fingerprint-generator.js';

export const ART_BASE = '/break_escape/assets/minigames/fingerprint/';

const rect = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

function speckle(c, w, h, seed, cols, count) {
    const r = mulberry32(seed);
    for (let i = 0; i < count; i++) {
        rect(c, cols[Math.floor(r() * cols.length)], Math.floor(r() * w), Math.floor(r() * h), 1, 1);
    }
}

function drawCeramic(c, w, h) {
    rect(c, '#e8e6df', 0, 0, w, h);
    // glaze: soft diagonal highlight and a shaded lower right
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const t = (x + y) / (w + h);
            if (t > 0.18 && t < 0.3) { c.fillStyle = 'rgba(255,255,255,0.32)'; c.fillRect(x, y, 1, 1); }
            if (t > 0.78) { c.fillStyle = `rgba(120,115,100,${(t - 0.78) * 0.7})`; c.fillRect(x, y, 1, 1); }
        }
    }
    speckle(c, w, h, 11, ['#d9d6cc', '#f4f2ec', '#dcd8cd'], 220);
    rect(c, '#cfcbbd', 0, 0, w, 2); rect(c, '#cfcbbd', 0, h - 2, w, 2);
}

function drawBezel(c, w, h) {
    rect(c, '#1c2128', 0, 0, w, h);
    rect(c, '#2a313a', 0, 0, w, 3); rect(c, '#2a313a', 0, 0, 3, h);
    rect(c, '#0f1318', 0, h - 3, w, 3); rect(c, '#0f1318', w - 3, 0, 3, h);
    rect(c, '#151a20', 9, 9, w - 18, h - 18);
    rect(c, '#0e1216', 11, 11, w - 22, h - 22);
    // reflection streaks on the glass
    for (let y = 11; y < h - 11; y++) {
        for (let x = 11; x < w - 11; x++) {
            const t = (x - y + h) % 48;
            if (t < 7) { c.fillStyle = 'rgba(255,255,255,0.045)'; c.fillRect(x, y, 1, 1); }
        }
    }
    rect(c, '#3a424d', w - 14, h - 8, 5, 2); // status light housing
    speckle(c, w, h, 21, ['#232a33', '#171c22'], 160);
}

function drawKeypad(c, w, h) {
    rect(c, '#4a4d52', 0, 0, w, h);
    speckle(c, w, h, 31, ['#55585e', '#3f4247', '#505359', '#44474c'], 900);
    const cols = 3, rows = 4, kw = 28, kh = 20, gx = 6, gy = 5;
    const ox = Math.floor((w - (cols * kw + (cols - 1) * gx)) / 2);
    const oy = Math.floor((h - (rows * kh + (rows - 1) * gy)) / 2);
    for (let r = 0; r < rows; r++) {
        for (let q = 0; q < cols; q++) {
            const x = ox + q * (kw + gx), y = oy + r * (kh + gy);
            rect(c, '#2c2e32', x, y + 2, kw, kh);
            rect(c, '#5e6268', x, y, kw, kh - 1);
            rect(c, '#6c7077', x + 1, y + 1, kw - 2, 2);
            rect(c, '#52565c', x + 3, y + 4, kw - 6, kh - 8);
        }
    }
}

function jar(body, lid, mark) {
    return (c, w, h) => {
        c.clearRect(0, 0, w, h);
        rect(c, '#00000055', 6, h - 5, w - 10, 3);
        rect(c, lid, 10, 2, w - 20, 9);
        rect(c, '#00000033', 10, 9, w - 20, 2);
        rect(c, body, 6, 11, w - 12, h - 18);
        rect(c, '#ffffff33', 8, 13, 3, h - 22);
        rect(c, '#f2f0ea', 11, 24, w - 22, 20);
        rect(c, '#00000022', 11, 43, w - 22, 1);
        c.fillStyle = '#222'; c.font = 'bold 12px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(mark, w / 2, 34);
    };
}

function drawBrushFine(c, w, h) {
    c.clearRect(0, 0, w, h);
    rect(c, '#7a4b24', 13, 4, 6, 34);
    rect(c, '#9a6a3c', 13, 4, 2, 34);
    rect(c, '#b9bec4', 11, 38, 10, 10);
    rect(c, '#8c9198', 11, 44, 10, 2);
    rect(c, '#2b2b2b', 13, 48, 6, 12);
    rect(c, '#444', 14, 54, 4, 8);
}

function drawBrushFeather(c, w, h) {
    c.clearRect(0, 0, w, h);
    rect(c, '#8a5a2c', 15, 2, 3, 22);
    rect(c, '#b9bec4', 13, 24, 7, 8);
    // feather vane
    for (let y = 30; y < 62; y++) {
        const half = Math.round(10 * Math.sin(((y - 30) / 32) * Math.PI) + 3);
        rect(c, y % 3 === 0 ? '#d7c9a3' : '#e9dfc2', 16 - half, y, half * 2, 1);
    }
    rect(c, '#b9a97f', 16, 28, 1, 34);
}

function drawWand(c, w, h) {
    c.clearRect(0, 0, w, h);
    rect(c, '#8c9198', 14, 8, 4, 40);
    rect(c, '#b9bec4', 14, 8, 1, 40);
    rect(c, '#2b2b2b', 12, 44, 8, 16);
    // horseshoe magnet tip
    rect(c, '#c0392b', 8, 2, 5, 8); rect(c, '#2e6bd1', 19, 2, 5, 8);
    rect(c, '#c0392b', 8, 8, 5, 4); rect(c, '#2e6bd1', 19, 8, 5, 4);
    rect(c, '#9a9fa6', 8, 10, 16, 3);
    rect(c, '#dfe3e8', 8, 1, 5, 2); rect(c, '#dfe3e8', 19, 1, 5, 2);
}

function drawTapeRoll(c, w, h) {
    c.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 + 2;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const d = Math.hypot(x - cx, y - cy);
            if (d < 19 && d > 8) { c.fillStyle = d > 16 ? '#cdbb7a' : '#e0d08f'; c.fillRect(x, y, 1, 1); }
            else if (d <= 8 && d > 5) { c.fillStyle = '#8a7a4c'; c.fillRect(x, y, 1, 1); }
        }
    }
    rect(c, '#e8dba2', 30, cy + 10, 16, 5);
    rect(c, '#cdbb7a', 30, cy + 14, 16, 1);
}

function drawBackingCard(c, w, h) {
    rect(c, '#f2f0ea', 0, 0, w, h);
    rect(c, '#bdb9ae', 0, 0, w, 2); rect(c, '#bdb9ae', 0, h - 2, w, 2);
    rect(c, '#bdb9ae', 0, 0, 2, h); rect(c, '#bdb9ae', w - 2, 0, 2, h);
    rect(c, '#d8d4c8', 6, h - 12, 54, 3);
    rect(c, '#d8d4c8', 6, h - 7, 34, 2);
    rect(c, '#d8d4c8', w - 22, h - 12, 16, 8);
}

/** Slot table: name -> { w, h, draw }. Sizes are the PNG sizes to supply. */
export const ART_SLOTS = {
    'surface-ceramic': { w: 128, h: 128, draw: drawCeramic },
    'surface-bezel': { w: 128, h: 128, draw: drawBezel },
    'surface-keypad': { w: 128, h: 128, draw: drawKeypad },
    'jar-black': { w: 32, h: 56, draw: jar('#1d2024', '#8c9198', 'B') },
    'jar-silver': { w: 32, h: 56, draw: jar('#aeb6bf', '#6b7077', 'S') },
    'jar-magnetic': { w: 32, h: 56, draw: jar('#26282d', '#c0392b', 'M') },
    'brush-fine': { w: 32, h: 64, draw: drawBrushFine },
    'brush-feather': { w: 32, h: 64, draw: drawBrushFeather },
    'wand': { w: 32, h: 64, draw: drawWand },
    'tape-roll': { w: 48, h: 48, draw: drawTapeRoll },
    // The slot is the 128x128 play area. A supplied PNG (the card is portrait, 65x88) is contained and centred in it.
    'backing-card': { w: 128, h: 128, draw: drawBackingCard }
};

/** Surface id -> slot name. */
export const SURFACE_SLOT = { glossy_light: 'surface-ceramic', glossy_dark: 'surface-bezel', textured: 'surface-keypad' };

// name -> HTMLImageElement once loaded, or false once known missing. Shared across opens so a missing PNG is
// requested once per page load.
const cache = {};
const pending = new Set();
const listeners = new Set();

/** Start loading every slot's PNG (idempotent). Calls listeners when one arrives. */
export function preloadArt() {
    if (typeof Image === 'undefined') return;
    for (const name of Object.keys(ART_SLOTS)) {
        if (name in cache || pending.has(name)) continue;
        pending.add(name);
        const img = new Image();
        img.onload = () => {
            pending.delete(name);
            const s = ART_SLOTS[name];
            // A wrong-sized file is still used (it is scaled), but the slot sizes above are what to supply.
            cache[name] = img;
            void s;
            listeners.forEach(fn => { try { fn(name); } catch (e) { /* ignore */ } });
        };
        img.onerror = () => { pending.delete(name); cache[name] = false; };
        img.src = `${ART_BASE}${name}.png`;
    }
}

/** Subscribe to "a PNG arrived" (to redraw). Returns an unsubscribe function. */
export function onArtLoaded(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/** True if a real PNG is being used for this slot. */
export function hasArt(name) {
    return !!cache[name];
}

/**
 * Where a slot's picture lands inside its w x h box. A procedural slot fills the box. A PNG is contained: scaled
 * to fit with its own aspect ratio and centred, so a portrait card in a square slot is not stretched.
 * `centreX` (optional) centres it on that x instead, clamped inside the box, for a card that has to sit under
 * a print that is not in the middle of the slot.
 */
export function artRect(name, centreX) {
    const slot = ART_SLOTS[name];
    const img = cache[name];
    if (!slot) return null;
    if (!img) return { x: 0, y: 0, w: slot.w, h: slot.h };
    const iw = img.naturalWidth || slot.w, ih = img.naturalHeight || slot.h;
    const k = Math.min(slot.w / iw, slot.h / ih);
    const w = Math.round(iw * k), h = Math.round(ih * k);
    const x = typeof centreX === 'number' ? Math.max(0, Math.min(slot.w - w, Math.round(centreX - w / 2))) : Math.floor((slot.w - w) / 2);
    return { x, y: Math.floor((slot.h - h) / 2), w, h };
}

/** Draw a slot into its own box on ctx (PNG contained and centred if present, else procedural). */
export function drawSlot(ctx, name, centreX) {
    const slot = ART_SLOTS[name];
    if (!slot) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (cache[name]) {
        const r = artRect(name, centreX);
        ctx.drawImage(cache[name], r.x, r.y, r.w, r.h);
    } else slot.draw(ctx, slot.w, slot.h);
    ctx.restore();
}

/** A canvas element showing a slot, redrawn when its PNG arrives. Scale is a CSS integer multiple. */
export function slotCanvas(name, scale = 2) {
    const slot = ART_SLOTS[name];
    const cv = document.createElement('canvas');
    cv.width = slot.w; cv.height = slot.h;
    cv.className = 'dusting-art';
    cv.style.width = `${slot.w * scale}px`;
    cv.style.height = `${slot.h * scale}px`;
    cv.setAttribute('aria-hidden', 'true');
    cv.dataset.art = name;
    drawSlot(cv.getContext('2d'), name);
    return cv;
}

/** Redraw every slot canvas under `root` (after a PNG arrives). */
export function refreshSlotCanvases(root) {
    root.querySelectorAll('canvas[data-art]').forEach(cv => {
        const ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, cv.width, cv.height);
        drawSlot(ctx, cv.dataset.art);
    });
}
