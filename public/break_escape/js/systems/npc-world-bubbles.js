/**
 * NPC speech bubbles in the world.
 *
 * Two sources share one layer:
 *   - Needs chatter (OFFICE_LIFE_PLAN 2.4, slice 8): the one-line chat paired NPCs trade at a
 *     shared object, read from npcNeedsSystem.getState().talking (timed on the needs clock).
 *   - Barks (UX feedback round slice 5): npc-barks.js calls say(npcId, line) for a person NPC in
 *     view, in place of the old pulsing talk icon and toast. A long line shows in pages of at
 *     most PAGE_LINES lines, timed to the voiced audio once its length is known
 *     (setAudioMs on the handle). If the NPC leaves view mid-line (the player changes room, the
 *     room goes dark, a minigame opens), the bubble closes and the rest of the line, from the
 *     page being shown onwards, goes to onRemainder (npc-barks.js shows it as a toast).
 *
 * Rules:
 *   - Only for NPCs in the player's current room, and not while that room is dark (the action
 *     icons' rule, npc-office-visuals.js iconShown/roomIsDark).
 *   - A bark bubble also needs the NPC's head on camera (cameras.main.worldView, inset by
 *     CAMERA_MARGIN): a bark from an NPC off screen is a toast, and a bark bubble whose NPC
 *     leaves the camera hands the rest of its line to the toast (slice 5 R1 M1).
 *   - Bubbles never cover each other, another speaker's head or the HUD panels (Objectives,
 *     inventory tray, buttons: R2 m2), and keep off the player's head where they can: each is
 *     placed in turn (barks first, nearest first) centred, then slid left or right of its NPC (the
 *     tail stays over the head), then lifted by at most MAX_LIFT with a 2 px stem down to the head
 *     (R1 n4, R2 n3), then beside the head with a short stepped pointer at head height, so the
 *     speaker stays clear (R2 m1). A bubble stays inside the camera's view (R1 M1). A bark with no
 *     such place goes to the toast from the page on screen.
 *   - Placed in the camera's preRender, once this frame's view is known (R2 n2).
 *   - A bark whose stillValid() stops holding closes, with no remainder (R1 n5).
 *   - Hidden while any minigame is open (a person-chat, a PC, a lock).
 *   - One bubble per NPC (a bark wins over that NPC's chatter), at most MAX_BUBBLES on screen:
 *     barks first, then the speakers nearest the player.
 *   - While shown, the NPC's action icon and thought bubble are hidden (npc-action-icons.js reads
 *     getState().talking and hasLine()).
 *   - While shown, the press-to-talk icon (interactions.js sprite.interactionIndicator, talk.png) of
 *     the speaker and its partner is hidden too: it sits at overlay depth over the speech bubble and
 *     read as a second, empty bubble. It comes back when the line ends if the player is still in
 *     range. The pass runs on the scene's postupdate, after checkObjectInteractions.
 *
 * Pixel-art rule: VT323 at 16 px (the action icons' world font), loaded before the first Text is
 * made; a 2 px frame with stepped corners and a stepped tail, all whole-pixel fillRects; positions
 * rounded; no scale on the container.
 *
 * Picture chat (slice 15, OFFICE_LIFE_PLAN 11.2): when talking.picture is set the bubble holds a
 * 16x16 icon (icons/npc-<name>.png, loaded on first use; a text stand-in until it has arrived)
 * and no text. Pictures are never voiced.
 *
 * Display only: nothing here is synced.
 */
import { iconShown, roomIsDark, npcIconAnchor } from './npc-office-visuals.js';
import { loadCanvasFonts } from '../utils/canvas-fonts.js';
import { LIGHT_DEPTH } from '../utils/constants.js';

export const MAX_BUBBLES = 4;
export const SPEECH_FONT = "'VT323', monospace";
export const SPEECH_FONT_PX = 16;
export const LINE_CHARS = 24;       // wrap width, in characters
export const PAGE_LINES = 3;        // lines a page shows at most
export const PAGE_MIN_MS = 1200;    // no page shows for less than this
export const AUDIO_TAIL_MS = 800;   // added to the voiced audio's length
export const BORDER_PX = 2;
const PAD_X = 4;
const PAD_Y = 2;
// Canvas measureText comes up short of VT323's drawn glyphs: the last glyph's right-hand
// pixels sit past the measured width. Added to the measured width so the gap to the right
// border matches the left one (R1 n1, checked in the 3x zoom shot).
export const TEXT_RIGHT_SLACK = 2;
export const CAMERA_MARGIN = 8;     // px: the head anchor must sit this far inside the view
const STILL_VALID_EVERY_MS = 250;   // how often a bark's stillValid() is asked
const HEAD_HALF_W = 10;             // px: the player's head box, either side of the anchor
const HEAD_H = 22;                  // px: the player's head box, down from the anchor
const TAIL_HALF = 6;                // px: tail half width plus border; the body must cover it
const TAIL = 4;           // px: the stepped pointer under the bubble, towards the head
const HUD_EVERY_MS = 200;          // how often the HUD panels' screen rects are read again
const HUD_GAP = 2;                  // px: kept between a bubble and a HUD panel
export const HUD_SELECTORS = ['.objectives-panel', '#inventory-container', '#health-ui-container', '#hud-info-label',
    '#scenario-timer-display', '#music-widget-btn-anchor', '#toggle-buttons-container', '#combat-buttons',
    '.phone-access-button', '.tutorial-panel',
    // R3 n2: the open music panel, an incoming call, the talk prompt, the VM controls, the
    // scanner panels, and each toast on screen (not the stacks, which can be empty and large)
    '#music-widget-panel', '#phone-ring-layer .incoming-call', '.npc-interaction-prompt', '#vm-controls-overlay',
    '.panel-container', '#bluetooth-panel', '#biometrics-panel',
    '#npc-bark-container .npc-bark', '#notification-container .notification'].join(', ');
// Above the room lighting (LIGHT_DEPTH, glows at +1 and +2): under it the fill took the
// room's light, a soft ramp with a hard seam at the room's edge (R3 m2). Below the overlay
// markers (overlayDepth: talk icons, health bars, damage numbers at LIGHT_DEPTH + 10 and up).
export const BUBBLE_DEPTH = LIGHT_DEPTH + 3;
// With lighting off (window.lightingSystem null) overlayDepth gives raw depths: the combat
// screen flash (10000) and the proximity ghost (9000) must stay above the bubbles, and the
// action icons (5000, hidden while a bark is up) below them (R4 n2).
export const BUBBLE_DEPTH_UNLIT = 8500;
const FILL = 0xffffff;
const LINE = 0x1b2a41;

const win = () => (typeof window !== 'undefined' ? window : {});

/** The bubbles' depth now: above the light map when lighting is on, else under the flash and ghost. */
export function bubbleDepth() {
    return win().lightingSystem ? BUBBLE_DEPTH : BUBBLE_DEPTH_UNLIT;
}

/** Pure: text compared on letters and digits only (the bubble's copy shows authored dashes). */
export function textKey(x) {
    return String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * Pure: the part of an unread follow-up `left` that `next` (the hint a newer answer carries)
 * does not already show: '' when `next` equals or ends with it; `left` less its tail when it
 * ends with `next` (a follow-up that carried an older hint before this one); else all of
 * `left`. So a hint is never shown twice (R4 m1).
 */
export function followUpBeyond(left, next) {
    const lk = textKey(left);
    if (!lk) return '';
    const nk = textKey(next);
    if (!nk) return pagesText([left]);
    if (nk.endsWith(lk)) return '';
    if (lk.endsWith(nk)) {
        const words = pagesText([left]).split(' ');
        let acc = '';
        for (let i = words.length - 1; i >= 0; i--) {
            acc = textKey(words[i]) + acc;
            if (acc === nk) return pagesText(words.slice(0, i));
            if (acc.length > nk.length) break;
        }
    }
    return pagesText([left]);
}

/**
 * Pure: the hints a newer answer should still carry from an older bubble: every unread hint of
 * `hints` (a list, one entry a gate) whose text is not `next`'s. So "H G" plus a new H gives
 * "G H", never H twice (R5 n1).
 */
export function hintsBeyond(hints, next) {
    const nk = textKey(next);
    const seen = new Set(nk ? [nk] : []);
    const out = [];
    for (const h of Array.isArray(hints) ? hints : []) {
        const k = textKey(h);
        if (!k || seen.has(k)) continue;
        seen.add(k);
        out.push(pagesText([h]));
    }
    return out;
}

/**
 * Is a minigame open now? One whose `_ending` is set is closing: person-chat drains the barks it
 * held from its own cleanup() while the framework still holds it, and holdsBarks() already counts
 * it as closed (R5 m1).
 */
export function minigameOpenNow() {
    const m = win().MinigameFramework?.currentMinigame;
    return !!(m && !m._ending);
}

// ---- pure helpers ----

/** Pure: may this NPC's bubble show at all? */
export function speechShown({ npcRoom, playerRoom, dark = false, minigameOpen = false }) {
    return !minigameOpen && iconShown({ npcRoom, playerRoom, dark });
}

/**
 * Pure: which of the candidate speakers get a bubble, in the order they are placed: at most
 * `max`; barks (`bark: true`) before chatter; barks already on screen (`held: true`) before new
 * ones, so a newcomer nearer the player cannot take the only free spot and send a line already
 * being read to the toast (R3 n5); then nearest the player first, ties by id.
 * `list` items are { npcId, distance, bark, held }.
 */
export function pickShown(list, max = MAX_BUBBLES) {
    return [...list]
        .sort((a, b) => (b.bark ? 1 : 0) - (a.bark ? 1 : 0)
            || (b.held ? 1 : 0) - (a.held ? 1 : 0)
            || (a.distance ?? Infinity) - (b.distance ?? Infinity)
            || (a.npcId < b.npcId ? -1 : a.npcId > b.npcId ? 1 : 0))
        .slice(0, max)
        .map(x => x.npcId);
}

/** Pure: the bubble container's position (its bottom-centre at the tail tip) for a head anchor. */
export function speechPosition(at) {
    return { x: Math.round(at.x), y: Math.round(at.y) };
}

/**
 * Pure: is this head anchor on camera? `view` is the camera's worldView ({ x, y, width, height });
 * with no view (no camera yet, tests) the answer is yes. The anchor must be `margin` inside.
 */
export function onCamera(at, view, margin = CAMERA_MARGIN) {
    if (!at || !view || !(view.width > 0) || !(view.height > 0)) return true;
    return at.x >= view.x + margin && at.x <= view.x + view.width - margin
        && at.y >= view.y + margin && at.y <= view.y + view.height - margin;
}

const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Pure: where a bubble of `w` by `h` (body, not counting the tail) sits for the head anchor `at`
 * so it covers none of `taken` and stays inside `view` (the camera's world view, when given).
 * `taken` items are rects { x, y, w, h }: bubbles already placed, other speakers' heads and HUD
 * panels are hard (never covered); ones with `soft: true` (the player's head) are kept clear when
 * possible and covered only when nothing else fits.
 * Order tried:
 *   1. Above the head: centred, slid left, slid right (the tail stays over the head), then
 *      lifted clear of the lowest thing in the way, but by MAX_LIFT at most (R2 n3: a long stem
 *      ran past the player's shoulder; a sideways move reads better than a tall lift).
 *   2. Beside the head, either side, with a short stepped pointer at head height, so the speaker
 *      stays clear when bubbles sit close (R2 m1). The body may move up or down while it still
 *      spans the pointer, to clear what is in the way.
 *   3. The same places again, now allowed over a soft rect.
 * Nothing that avoids every hard rect: null (the caller hands a bark to the toast).
 * `prefer` (last frame's choice) is tried first, so a bubble does not flip from frame to frame.
 * Returns { dx, lift, rect, beside, side, pointY }: dx shifts the body sideways, lift raises body
 * and tail (the body's top is at at.y - lift - tail - h); beside: side is -1 (body left of the
 * head) or 1, and pointY the pointer's centre row, relative to the anchor.
 */
export const MAX_LIFT = 16;
export const HEAD_POINT_DY = 10;    // px: the beside pointer's row, below the anchor (mid head)
export function placeBubble(at, w, h, taken, { prefer = null, view = null, tail = TAIL, maxLift = MAX_LIFT } = {}) {
    const slide = Math.max(0, Math.floor(w / 2) - TAIL_HALF);
    let order = [0, -slide, slide];
    if (prefer && !prefer.beside && order.includes(prefer.dx)) order = [prefer.dx, ...order.filter(d => d !== prefer.dx)];
    const rectFor = (dx, lift) => ({ x: at.x + dx - w / 2, y: at.y - lift - tail - h, w, h: h + tail });
    const inside = (r) => !view || (r.x >= view.x && r.x + r.w <= view.x + view.width
        && r.y >= view.y && r.y + r.h <= view.y + view.height);
    const hard = taken.filter(t => !t.soft);
    const free = (r) => !taken.some(t => overlaps(r, t));
    const hardFree = (r) => !hard.some(t => overlaps(r, t));
    const cands = [];
    // 1. above, lifting at most maxLift
    let lift = 0;
    for (let i = 0; i < 6 && lift <= maxLift; i++) {
        let lowestTop = null;
        for (const dx of order) {
            const rect = rectFor(dx, lift);
            if (!inside(rect)) continue;
            cands.push({ dx, lift, rect, beside: false, side: 0, pointY: 0 });
            for (const t of taken) if (overlaps(rect, t)) lowestTop = lowestTop === null ? t.y : Math.max(lowestTop, t.y);
        }
        if (lowestTop === null) break;
        // Lift so the bottom (tail tip) clears the top of the lowest thing hit
        let next = Math.max(lift + 2, at.y - lowestTop + 2);
        if (next % 2) next += 1;
        lift = next;
    }
    // 2. beside the head, with a pointer at head height
    const gap = HEAD_HALF_W + 2 + tail;   // body edge to head centre; the pointer's tip stops 12 px short
    let sides = view && (at.x - view.x) < (view.x + view.width - at.x) ? [1, -1] : [-1, 1];
    if (prefer?.beside && prefer.side === sides[1]) sides = [sides[1], sides[0]];
    const py = at.y + HEAD_POINT_DY;
    // The body must span the pointer (its 8 px plus the stepped corners): top in [py - h + 8, py - 8]
    const topMin = py - h + 2 * BORDER_PX + 6, topMax = py - 2 * BORDER_PX - 6;
    const viewTop = view ? Math.ceil(view.y) + 2 : -Infinity;
    const viewBottom = view ? Math.floor(view.y + view.height) - 2 : Infinity;
    for (const side of sides) {
        const dx = side * (Math.floor(w / 2) + gap);
        const bodyX = at.x + dx - w / 2;
        // Tops to try: centred on the pointer, last frame's, then clear of each rect in the way
        const tops = [];
        if (prefer?.beside && prefer.side === side) tops.push(at.y - prefer.lift - tail - h);
        tops.push(Math.round(py - h / 2));
        for (const t of taken) { tops.push(t.y + t.h + 2); tops.push(t.y - h - 2); }
        const seen = new Set();
        for (let top of tops) {
            top = Math.max(topMin, Math.min(topMax, top));
            top = Math.max(top, viewTop);
            if (top + h > viewBottom) top = viewBottom - h;
            if (top < topMin || top > topMax) continue;   // the view leaves no room that spans the head
            if (seen.has(top)) continue;
            seen.add(top);
            const body = { x: bodyX, y: top, w, h };
            if (!inside(body)) continue;
            // The pointer reaches TAIL px towards the head: count it in the rect
            const rect = side < 0 ? { ...body, w: w + TAIL } : { ...body, x: bodyX - TAIL, w: w + TAIL };
            if (!inside(rect)) continue;
            cands.push({ dx, lift: at.y - tail - h - top, rect, beside: true, side, pointY: HEAD_POINT_DY });
        }
    }
    return cands.find(c => free(c.rect)) || cands.find(c => hardFree(c.rect)) || null;
}

/**
 * Make a Phaser Text's glyphs hard-edged: canvas fillText smooths glyph edges, which shows as
 * grey fringes once the canvas is scaled up. Every pixel of the Text's own canvas becomes either
 * clear or solid `colour` (alpha threshold at half), and the texture is uploaded again as
 * Text.updateText does. Returns the ink's bounds { left, right, top, bottom } in canvas pixels,
 * or null (no canvas, as in node tests, or no ink), so the frame can pad from the glyphs
 * themselves rather than the font's measured advance (main-19, R1 n1).
 */
export function crispText(t, colour = LINE) {
    const c = t?.canvas;
    if (!c || !(c.width > 0) || !(c.height > 0) || typeof c.getContext !== 'function') return null;
    let ctx, img;
    try { ctx = c.getContext('2d'); img = ctx.getImageData(0, 0, c.width, c.height); } catch (e) { return null; }
    const d = img.data, w = c.width, h = c.height;
    const R = (colour >> 16) & 255, G = (colour >> 8) & 255, B = colour & 255;
    let left = w, right = -1, top = h, bottom = -1;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            if (d[i + 3] >= 128) {
                d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = 255;
                if (x < left) left = x; if (x > right) right = x;
                if (y < top) top = y; if (y > bottom) bottom = y;
            } else {
                d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = 0;
            }
        }
    }
    ctx.putImageData(img, 0, 0);
    try {
        if (t.renderer?.gl && t.frame?.source) {
            t.frame.source.glTexture = t.renderer.canvasToTexture(c, t.frame.source.glTexture, true);
            t.frame.glTexture = t.frame.source.glTexture;
        }
    } catch (e) { /* the canvas renderer draws from the canvas itself */ }
    t.dirty = true;
    return right < 0 ? null : { left, right, top, bottom };
}

/** Pure: the texture key and path of a picture-chat icon. */
export function pictureTexture(name) {
    return { key: `icon:npc-${name}`, path: `icons/npc-${name}.png` };
}

export const PICTURE_PX = 16;

/** Pure: word-wrap at `width` characters; a word longer than the width gets a line of its own. */
export function wrapLines(text, width = LINE_CHARS) {
    const words = String(text ?? '').trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    for (const w of words) {
        if (!cur) cur = w;
        else if (cur.length + 1 + w.length <= width) cur += ' ' + w;
        else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
}

/**
 * Pure: the line in pages of at most `perPage` wrapped lines; each page is its lines joined by
 * "\n". When the last page would be short (under half a page's share of the words, such as one
 * word), the words are spread evenly over the same number of pages instead, if each still fits
 * (R3 n3).
 */
export function pageLine(text, { width = LINE_CHARS, perPage = PAGE_LINES } = {}) {
    const lines = wrapLines(text, width);
    const pages = [];
    for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage).join('\n'));
    if (pages.length < 2) return pages;
    const words = String(text ?? '').trim().split(/\s+/).filter(Boolean);
    const n = pages.length;
    if (wordsIn(pages[n - 1]) * 2 >= words.length / n) return pages;
    const even = [];
    for (let i = 0; i < n; i++) {
        const chunk = wrapLines(words.slice(Math.round(i * words.length / n), Math.round((i + 1) * words.length / n)).join(' '), width);
        if (chunk.length === 0 || chunk.length > perPage) return pages;
        even.push(chunk.join('\n'));
    }
    return even;
}

/** Pure: a page (or pages) as plain one-line text: the words joined by single spaces. */
export function pagesText(pages) {
    return pages.join(' ').split(/\s+/).filter(Boolean).join(' ');
}

/**
 * Pure: a bark state's follow-up, as one-line text, while any of it is still unread (the page on
 * screen counts as unread); '' when it has none or the bubble has finished. Always the whole
 * follow-up, never a part cut at a page break mid-sentence (R3 m1, R4 n1).
 */
export function followUpLeft(st) {
    if (!st || !Array.isArray(st.pages)) return '';
    const from = st.linePages ?? st.pages.length;
    if (from >= st.pages.length || (st.page || 0) >= st.pages.length) return '';
    return pagesText(st.pages.slice(from));
}

/**
 * Pure: a bark state's hints (st.hints, one entry a gate) while any of its follow-up is unread,
 * else []. A state with no list (made before R5) gives its follow-up text as one entry.
 */
export function hintsLeft(st) {
    const left = followUpLeft(st);
    if (!left) return [];
    return Array.isArray(st.hints) && st.hints.length ? [...st.hints] : [left];
}

const wordsIn = (s) => String(s).split(/\s+/).filter(Boolean).length;

/** Pure: each page's share of `totalMs` by word count, at least `minMs` a page. */
export function pageTimes(pages, totalMs, minMs = PAGE_MIN_MS) {
    const counts = pages.map(wordsIn);
    const all = counts.reduce((s, n) => s + n, 0) || 1;
    return counts.map(n => Math.max(minMs, Math.round(totalMs * n / all)));
}

/** Pure: follow-up pages (not voiced): each its own reading time, at least PAGE_MIN_MS. */
export function followUpTimes(pages) {
    return pages.map(p => Math.max(PAGE_MIN_MS, Math.min(8000, 1500 + wordsIn(p) * 300)));
}

/** Pure: the whole line's time: the audio's length plus AUDIO_TAIL_MS, else the reading time. */
export function lineTotalMs({ audioMs = null, readingMs }) {
    return audioMs > 0 ? audioMs + AUDIO_TAIL_MS : readingMs;
}

// The toast's reading time (bark-lifetime.js barkLifetimeMs), kept here so this module needs no
// further import: 3 s + 300 ms a word, 5 to 20 s.
export function readingMs(text) {
    return Math.min(20000, Math.max(5000, 3000 + wordsIn(text) * 300));
}

/**
 * Pure: may a new bark bubble open, given the bark bubbles already up?
 * Returns { ok: true, evict: npcId|null } or { ok: false } (farther than all of a full set).
 * `others` items are { npcId, distance }.
 */
export function barkCapacity(others, distance, max = MAX_BUBBLES) {
    if (others.length < max) return { ok: true, evict: null };
    const far = [...others].sort((a, b) => (b.distance ?? Infinity) - (a.distance ?? Infinity))[0];
    if ((distance ?? Infinity) >= (far.distance ?? Infinity)) return { ok: false };
    return { ok: true, evict: far.npcId };
}

// ---- the layer ----

export class NpcWorldBubbles {
    constructor({ now = () => Date.now(), fontsReady = false } = {}) {
        this.bubbles = new Map(); this.sceneHooked = null; this.textures = new Map(); this.talkHidden = new Set();
        this.says = new Map();   // npcId -> bark state (say())
        this.now = now;
        this.fontsReady = fontsReady;
        this._fontsAsked = false;
        this.log = [];           // [{ t, npcId, event, page, text }] for live checks (bounded)
        // Chatter voice (R4 n4), each at most one entry per NPC: a voice waiting for this
        // frame's placement, the chatter line on screen last frame, a line skipped (no room)
        this.chatterVoice = new Map();    // npcId -> { line, speak }
        this.chatterShown = new Map();    // npcId -> line
        this.chatterSkipped = new Map();  // npcId -> line
        this.chatterMust = new Map();     // npcId -> an exchange or call line: never skipped (R5 m2)
        this._updatedAt = null;
    }

    /**
     * An exchange or call line (npc-needs.js world.speak: info.knot or info.call). It is voiced at
     * once, not deferred, and is never skipped for want of room: with no bubble to fit it goes to
     * a silent toast, once. The exchange counts as heard (heard_<knot>), so the player must get
     * every line (R5 m2). At most one entry per NPC, dropped when the line ends.
     */
    mustShowChatter(npcId, line) {
        if (!npcId || !line) return;
        this.chatterMust.set(npcId, line);
    }

    /** A must-show line with no bubble: as a toast of its own, silent (its voice is playing). */
    _toastChatter(npcId, line, why) {
        this.chatterMust.delete(npcId);
        this.chatterShown.delete(npcId);
        this.chatterSkipped.set(npcId, line);   // not placed in a bubble later in the line
        this._note(npcId, 'chatter-toast', { text: line, why });
        const npc = win().npcManager?.getNPC?.(npcId) || null;
        try {
            win().barkSystem?.showBark?.({
                npcId, npcName: npc?.displayName || npcId, avatar: npc?.avatar, message: line,
                playSound: false, useTTS: false, forceToast: true, openPhone: false
            });
        } catch (e) { /* never break a frame */ }
    }

    /**
     * Needs chatter asks before it voices a line (npc-needs.js world.speak): the voice starts when
     * this frame's update() places the line's bubble, and never when it finds no room (the line
     * is skipped: no voice, no bubble, and it expires on the needs clock as before). Returns false
     * when the layer is not running (no update for 500 ms): the caller speaks at once.
     */
    deferChatterVoice(npcId, line, speak) {
        if (!npcId || !line || typeof speak !== 'function') return false;
        if (this._updatedAt === null || this.now() - this._updatedAt > 500) return false;
        this.chatterVoice.set(npcId, { line, speak });
        return true;
    }

    _voiceChatter(npcId) {
        const v = this.chatterVoice.get(npcId);
        this.chatterVoice.delete(npcId);
        if (v) { try { v.speak(); } catch (e) { /* audio never breaks a frame */ } }
    }

    /**
     * A chatter line with no room: skipped; a voice waiting for it is dropped, one playing stopped.
     * An exchange or call line is toasted instead (mustShowChatter).
     */
    _skipChatter(npcId, line, why) {
        if (this.chatterMust.get(npcId) === line) { this._toastChatter(npcId, line, why); return; }
        const waiting = this.chatterVoice.get(npcId);
        if (waiting && waiting.line === line) this.chatterVoice.delete(npcId);
        const wasShown = this.chatterShown.get(npcId) === line;
        this.chatterShown.delete(npcId);
        this.chatterSkipped.set(npcId, line);
        if (wasShown) { try { win().npcChatterVoice?.cancel?.(npcId); } catch (e) { /* already stopped */ } }
        this._note(npcId, wasShown ? 'chatter-dropped' : 'chatter-skipped', { text: line, why });
    }

    _note(npcId, event, extra = {}) {
        this.log.push({ t: this.now(), npcId, event, ...extra });
        if (this.log.length > 60) this.log.shift();
    }

    /** VT323 must be loaded before the first Text is made (canvas text does not fetch it). */
    _ensureFonts() {
        if (this.fontsReady) return true;
        if (!this._fontsAsked) {
            this._fontsAsked = true;
            const p = win().canvasFontsReady || loadCanvasFonts();
            Promise.resolve(p).then(() => { this.fontsReady = true; }, () => { this.fontsReady = true; });
        }
        return false;
    }

    _make(scene) {
        const g = scene.add.graphics();
        const text = scene.add.text(0, 0, '', {
            fontFamily: SPEECH_FONT, fontSize: `${SPEECH_FONT_PX}px`, color: '#1b2a41', lineSpacing: 0
        }).setOrigin(0, 0);
        const img = scene.add.image(0, 0, '__DEFAULT').setOrigin(0, 0).setVisible(false);
        const box = scene.add.container(0, 0, [g, text, img]).setDepth(bubbleDepth());
        return { box, g, text, img, line: null };
    }

    /** Is a picture's texture ready? Starts a one-off load the first time. */
    _textureReady(scene, r) {
        if (scene.textures?.exists?.(r.key)) return true;
        if (this.textures.get(r.key)) return false;
        this.textures.set(r.key, 'loading');
        try {
            scene.load.image(r.key, r.path);
            scene.load.once(`filecomplete-image-${r.key}`, () => this.textures.delete(r.key));
            if (!scene.load.isLoading?.()) scene.load.start();
        } catch (e) { this.textures.set(r.key, 'failed'); }
        return false;
    }

    /**
     * Draw the frame: 2 px border, stepped corners, stepped tail; whole pixels only. `dx` slides
     * the body sideways (the tail stays at x 0, over the head); `lift` raises body and tail, with a
     * 2 px stem down to the head. Beside the head (`side` -1: body on the left) the tail is a
     * short stepped pointer out of the body's near edge at `pointY` (R2 m1).
     */
    _drawFrame(g, w, h, dx = 0, lift = 0, beside = false, side = 0, pointY = 0) {
        const x = dx - w / 2, y = -lift - TAIL - h, b = BORDER_PX;
        g.clear();
        // Fill, inset so the corner notches stay clear
        g.fillStyle(FILL, 1);
        g.fillRect(x + b, y + b, w - 2 * b, h - 2 * b);
        // Border: four edges, each stopping short of the corner by one step
        g.fillStyle(LINE, 1);
        g.fillRect(x + b, y, w - 2 * b, b);              // top
        g.fillRect(x + b, y + h - b, w - 2 * b, b);      // bottom
        g.fillRect(x, y + b, b, h - 2 * b);              // left
        g.fillRect(x + w - b, y + b, b, h - 2 * b);      // right
        if (beside) {
            // The bottom tail turned on its side: u runs out of the edge towards the head, v
            // across it, centred on the pointer row
            const edge = side < 0 ? x + w : x;           // the body's edge on the head side
            const py = Math.round(pointY);
            const r = (u0, u1, v0, v1) => (side < 0
                ? g.fillRect(edge + u0, py + v0, u1 - u0, v1 - v0)
                : g.fillRect(edge - u1, py + v0, u1 - u0, v1 - v0));
            g.fillStyle(FILL, 1);
            r(-b, 0, -2, 2);                             // gap in the edge
            g.fillStyle(LINE, 1);
            r(-b, 0, -4, -2); r(-b, 0, 2, 4);
            r(0, 2, -4, -2); r(0, 2, 2, 4);
            g.fillStyle(FILL, 1);
            r(0, 2, -2, 2);
            g.fillStyle(LINE, 1);
            r(2, 4, -2, 2);                              // tip
            return;
        }
        // Tail: two 2 px steps narrowing to the tip, opened into the box
        const by = -lift - TAIL;                         // box bottom edge
        g.fillStyle(FILL, 1);
        g.fillRect(-2, by - b, 4, b);                    // gap in the bottom edge
        g.fillStyle(LINE, 1);
        g.fillRect(-4, by - b, 2, b);
        g.fillRect(2, by - b, 2, b);
        g.fillRect(-4, by, 2, 2);
        g.fillRect(2, by, 2, 2);
        g.fillStyle(FILL, 1);
        g.fillRect(-2, by, 4, 2);
        g.fillStyle(LINE, 1);
        g.fillRect(-2, by + 2, 4, 2);                    // tip
        if (lift > 0) g.fillRect(-1, by + 4, 2, lift);   // stem down to the head
    }

    /** Set the text (or picture) and measure the bubble; only when the line changes. */
    _render(bb, line, picture = null) {
        const tex = picture ? pictureTexture(picture) : null;
        const ready = !!(tex && bb.box.scene && this._textureReady(bb.box.scene, tex));
        const sig = picture ? `pic:${picture}:${ready}` : line;
        if (bb.line === sig) return;
        bb.line = sig;
        bb.picture = picture;
        bb.ready = ready;
        bb.img.setVisible(ready);
        if (ready) bb.img.setTexture(tex.key);
        const shown = picture ? (ready ? '' : '…') : String(line ?? '');
        // Chatter lines wrap the same way; a bark page is already wrapped
        bb.text.setText(shown.includes('\n') ? shown : wrapLines(shown).join('\n'));
        // Hard-edged glyphs; pad from the ink when it can be read, else from the measured width
        const ink = ready ? null : crispText(bb.text);
        bb.inkLeft = ink ? ink.left : 0;
        const cw = ready ? PICTURE_PX : (ink ? ink.right - ink.left + 1 : Math.ceil(bb.text.width) + TEXT_RIGHT_SLACK);
        const ch = ready ? PICTURE_PX : Math.ceil(bb.text.height);
        let w = cw + PAD_X * 2 + BORDER_PX * 2;
        if (w % 2) w += 1;                               // even, so -w/2 is a whole pixel
        const h = ch + PAD_Y * 2 + BORDER_PX * 2;
        bb.w = w; bb.h = h;
        bb.layout = null;                                // redraw at the next _layout
    }

    /** Draw the frame and place the text for this layout ({ dx, lift }); only when it changes. */
    _layout(bb, { dx = 0, lift = 0, beside = false, side = 0, pointY = 0 } = {}) {
        const l = bb.layout;
        if (l && l.dx === dx && l.lift === lift && l.beside === beside && l.side === side && l.pointY === pointY) return;
        bb.layout = { dx, lift, beside, side, pointY };
        const { w, h } = bb;
        const left = dx - w / 2 + BORDER_PX + PAD_X - (bb.inkLeft || 0);
        const top = -lift - TAIL - h + BORDER_PX + PAD_Y;
        bb.text.setPosition(left, top);
        bb.img.setPosition(Math.round(dx - PICTURE_PX / 2), top);
        this._drawFrame(bb.g, w, h, dx, lift, beside, side, pointY);
    }

    /** The player's head as a rect bubbles keep off. */
    _playerHead() {
        const pl = win().player;
        if (!pl) return null;
        let at;
        try { at = npcIconAnchor(pl); } catch (e) { return null; }
        return { x: at.x - HEAD_HALF_W, y: at.y, w: HEAD_HALF_W * 2, h: HEAD_H };
    }

    // ---- where an NPC is ----

    _spriteAndRoom(npcId) {
        const b = win().npcBehaviorManager?.getBehavior?.(npcId);
        if (b?.sprite) return { sprite: b.sprite, roomId: b.roomId };
        const rooms = win().rooms;
        if (rooms) {
            for (const [roomId, room] of Object.entries(rooms)) {
                const s = room?.npcSprites?.find?.(x => x.npcId === npcId);
                if (s) return { sprite: s, roomId };
            }
        }
        return { sprite: null, roomId: null };
    }

    _distance(sprite) {
        const pl = win().player;
        if (!pl || !sprite) return null;
        const pp = pl.body?.center || { x: pl.x, y: pl.y };
        return Math.hypot(pp.x - sprite.x, pp.y - sprite.y);
    }

    /** Is this sprite's head on the main camera? Yes when there is no camera to ask. */
    _onCamera(sprite) {
        if (!sprite) return false;
        const cam = sprite.scene?.cameras?.main || win().game?.cameras?.main;
        const view = cam?.worldView;
        if (!view) return true;
        let at;
        try { at = npcIconAnchor(sprite); } catch (e) { at = { x: sprite.x, y: sprite.y }; }
        return onCamera(at, view);
    }

    /** The facts npc-barks.js routeBark() needs for this NPC, read now. */
    viewFacts(npcId) {
        const { sprite, roomId } = this._spriteAndRoom(npcId);
        const live = !!(sprite && sprite.active !== false && sprite.visible !== false && !sprite.destroyed);
        return {
            hasSprite: live,
            npcRoom: roomId,
            playerRoom: win().currentPlayerRoom,
            dark: roomId ? roomIsDark(roomId) : false,
            minigameOpen: minigameOpenNow(),
            onCamera: live ? this._onCamera(sprite) : false
        };
    }

    _inView(npcId) {
        const f = this.viewFacts(npcId);
        return f.hasSprite && f.onCamera && speechShown(f);
    }

    /** Is a bark bubble up for this NPC now? (npc-action-icons.js hides its icons meanwhile.) */
    hasLine(npcId) { return this.says.has(npcId); }

    /**
     * Close every bark bubble answering `tag` (an event pattern), with no remainder: a newer
     * answer (the door's own notification for a refusal in the guard's cooldown) replaces it
     * (R2 n1). `followUp` is the hint the new answer carries: a bubble whose unread follow-up is
     * that same hint closes quietly; one with another hint hands it on (onFollowUpLost, R3 m1).
     * Returns the NPCs closed.
     */
    closeTagged(tag, { followUp = null } = {}) {
        const closed = [];
        if (!tag) return closed;
        for (const st of [...this.says.values()]) {
            if (st.tag !== tag) continue;
            // Only the hints the new answer does not already show (R4 m1, R5 n1)
            const rest = hintsBeyond(hintsLeft(st), followUp).join(' ');
            this._end(st.npcId, 'superseded', { handOn: !!rest, rest });
            closed.push(st.npcId);
        }
        return closed;
    }

    // ---- barks ----

    /**
     * Show a bark line over the NPC. Returns a handle { setAudioMs(ms), close() }, or null when
     * the bubble cannot take it (out of view, or farther than all of a full set of bark bubbles):
     * the caller then shows a toast.
     * @param {object} o
     * @param {number|null} [o.audioMs]   the voiced audio's length, when already known
     * @param {(rest:string)=>void} [o.onRemainder]  the rest of the line, when it leaves view
     * @param {()=>void} [o.onDone]
     * @param {()=>boolean} [o.stillValid]  the bark's conditions; false closes it, no remainder
     * @param {string|null} [o.followUp]  pages shown after the line, timed for reading (not to the
     *   voice): a gate's lockedHint after the guard's refusal (R2 m3)
     * @param {string|null} [o.tag]  what the line answers (the event pattern), for closeTagged()
     * @param {(text:string)=>void} [o.onFollowUpLost]  follow-up pages not yet read when the
     *   bubble ends early (stillValid, close(), closeTagged with another hint): npc-barks.js shows
     *   them as a toast of their own, so a lockedHint is never lost (R3 m1)
     */
    say(npcId, line, { audioMs = null, onRemainder = null, onDone = null, stillValid = null, followUp = null, tag = null, onFollowUpLost = null } = {}) {
        const linePages = pageLine(line);
        if (!npcId || linePages.length === 0) return null;
        if (!this._inView(npcId)) return null;
        const { sprite } = this._spriteAndRoom(npcId);
        const distance = this._distance(sprite);
        // A new line from the same NPC replaces its old one (its voice was cut too). Follow-up
        // pages of the old line not yet read go after the new line, once (R3 m1)
        const old = this.says.get(npcId) || null;
        const next = followUp ? pagesText([followUp]) : '';
        // Every unread hint the old bubble carries, less the new one: kept as a list, so a hint
        // is never shown twice however the gates alternate (R4 m1, R5 n1)
        const carriedHints = old ? hintsBeyond(hintsLeft(old), next) : [];
        const carried = carriedHints.join(' ');
        if (old) this._end(npcId, 'replaced', { handOn: false });
        const lost = typeof onFollowUpLost === 'function' ? onFollowUpLost : (old?.onFollowUpLost || null);
        const hints = [...carriedHints, ...(next ? [next] : [])];
        const allFollow = hints.join(' ');
        const extra = allFollow ? pageLine(allFollow) : [];
        const pages = [...linePages, ...extra];
        const others = [...this.says.keys()].map(id => ({ npcId: id, distance: this._distance(this._spriteAndRoom(id).sprite) }));
        const cap = barkCapacity(others, distance);
        if (!cap.ok) {
            this._note(npcId, 'full');
            // The caller toasts the new line with its own follow-up; a carried one goes on its own
            if (carried) { try { lost?.(carried); } catch (e) { /* never break a frame */ } }
            return null;
        }
        if (cap.evict) this._leave(cap.evict, 'pushed');
        const reading = readingMs(line);
        const st = {
            npcId, line, pages, hints, linePages: linePages.length, page: 0, started: this.now(), pageStarted: this.now(),
            times: [...pageTimes(linePages, lineTotalMs({ audioMs, readingMs: reading })), ...followUpTimes(extra)],
            audioMs: audioMs > 0 ? audioMs : null, onRemainder, onDone, tag: tag || null, onFollowUpLost: lost,
            stillValid: typeof stillValid === 'function' ? stillValid : null, validAt: this.now()
        };
        this.says.set(npcId, st);
        this._note(npcId, 'say', { page: 0, text: pages[0], pages: pages.length });
        const handle = {
            setAudioMs: (ms) => this._retime(st, ms),
            close: () => { if (this.says.get(npcId) === st) this._end(npcId, 'closed'); },
            state: st
        };
        return handle;
    }

    /** The audio's length arrived: re-time the pages still to come to it. */
    _retime(st, ms) {
        if (!(ms > 0) || this.says.get(st.npcId) !== st) return;
        st.audioMs = ms;
        // The voice covers the line's own pages; follow-up pages keep their reading time
        const n = st.linePages ?? st.pages.length;
        const times = pageTimes(st.pages.slice(0, n), lineTotalMs({ audioMs: ms, readingMs: 0 }));
        for (let i = st.page + 1; i < n; i++) st.times[i] = times[i];
        this._note(st.npcId, 'audio', { ms });
    }

    /**
     * Close a bark bubble. Ended for any reason but 'done', its follow-up pages not yet read go
     * to onFollowUpLost (R3 m1), unless `handOn` is false: the remainder paths already carry
     * them, a replacing line takes them on, and a notification with the same hint shows it.
     */
    _end(npcId, why, { handOn = true, rest: restGiven = null } = {}) {
        const st = this.says.get(npcId);
        if (!st) return;
        this.says.delete(npcId);
        const bb = this.bubbles.get(npcId);
        if (bb) { bb.box.setVisible(false); bb.line = null; }
        this._note(npcId, why, { page: st.page });
        if (why === 'done') { try { st.onDone?.(); } catch (e) { /* never break a frame */ } }
        else if (handOn) {
            const rest = restGiven ?? followUpLeft(st);
            if (rest) {
                this._note(npcId, 'follow-up-lost', { page: st.page, text: rest });
                try { st.onFollowUpLost?.(rest); } catch (e) { /* never break a frame */ }
            }
        }
    }

    /** Left view (or pushed out): close, and hand the rest of the line, this page onwards, on. */
    _leave(npcId, why) {
        const st = this.says.get(npcId);
        if (!st) return;
        // On a follow-up page: the whole follow-up, not its tail from a mid-sentence break (R4 n1)
        const n = st.linePages ?? st.pages.length;
        const rest = pagesText(st.pages.slice(st.page < n ? st.page : n));
        this._end(npcId, why, { handOn: false });
        this._note(npcId, 'remainder', { page: st.page, text: rest });
        if (rest) { try { st.onRemainder?.(rest); } catch (e) { /* never break a frame */ } }
    }

    /** Advance pages, close finished lines and ones out of view. */
    _tickSays() {
        const t = this.now();
        for (const st of [...this.says.values()]) {
            if (st.stillValid && t - st.validAt >= STILL_VALID_EVERY_MS) {
                st.validAt = t;
                let ok = true;
                try { ok = st.stillValid() !== false; } catch (e) { ok = true; }
                if (!ok) { this._end(st.npcId, 'stale'); continue; }
            }
            if (!this._inView(st.npcId)) { this._leave(st.npcId, 'left-view'); continue; }
            while (st.page < st.pages.length && t - st.pageStarted >= st.times[st.page]) {
                st.pageStarted += st.times[st.page];
                st.page++;
                if (st.page < st.pages.length) this._note(st.npcId, 'page', { page: st.page, text: st.pages[st.page] });
            }
            if (st.page >= st.pages.length) this._end(st.npcId, 'done');
        }
    }

    /** Per-frame: one bubble per NPC that is saying a line now. */
    update() {
        this._updatedAt = this.now();
        this._tickSays();
        const sys = win().npcNeedsSystem;
        const mgr = win().npcBehaviorManager;
        const playerRoom = win().currentPlayerRoom;
        const minigameOpen = minigameOpenNow();
        const cands = [];
        const info = new Map();
        for (const st of this.says.values()) {
            const { sprite } = this._spriteAndRoom(st.npcId);
            const bb = this.bubbles.get(st.npcId);
            const held = !!(bb && bb.box?.visible && bb.sayState === st);
            cands.push({ npcId: st.npcId, distance: this._distance(sprite), bark: true, held });
            info.set(st.npcId, { sprite, line: st.pages[st.page], picture: null, partnerId: null, bark: true });
        }
        const chatterNow = new Map();   // npcId -> the chatter line it is saying now
        if (sys && mgr) {
            for (const id of sys.states.keys()) {
                const st = sys.getState(id);
                if (st?.talking?.line) chatterNow.set(id, st.talking.line);
                if (this.chatterSkipped.has(id) && this.chatterSkipped.get(id) !== st?.talking?.line) this.chatterSkipped.delete(id);
                if (info.has(id)) {
                    // A bark wins over the same NPC's chatter: that line is skipped (R4 n4)
                    const l = st?.talking?.line;
                    if (l && this.chatterSkipped.get(id) !== l) this._skipChatter(id, l, 'own-bark');
                    continue;
                }
                if (!st?.talking) continue;
                if (st.talking.line && this.chatterSkipped.get(id) === st.talking.line) continue;   // skipped: not shown later
                const b = mgr.getBehavior?.(id);
                const sprite = b?.sprite;
                if (!sprite || !sprite.active || !sprite.visible || sprite.destroyed) continue;
                if (!speechShown({ npcRoom: b.roomId, playerRoom, dark: roomIsDark(b.roomId), minigameOpen })) continue;
                // Off camera: no bubble to place, so no candidate; its voice plays from the end
                // loop below, as for another room (R5 n2)
                if (!this._onCamera(sprite)) continue;
                cands.push({ npcId: id, distance: this._distance(sprite) });
                info.set(id, { sprite, line: st.talking.line, picture: st.talking.picture || null, partnerId: st.talking.partnerId, bark: false });
            }
        }
        const order = pickShown(cands);
        const shown = new Set(order);
        const muteTalk = new Set();
        for (const id of shown) {
            muteTalk.add(info.get(id).sprite);
            const partner = info.get(id).partnerId;
            const ps = partner ? mgr?.getBehavior?.(partner)?.sprite : null;
            if (ps) muteTalk.add(ps);
        }
        this._muteTalkIcons(muteTalk);
        for (const [id, bb] of this.bubbles) {
            if (!shown.has(id)) bb.box.setVisible(false);
        }
        // Chatter candidates left out by the bubble cap found no room (R4 n4)
        for (const c of cands) {
            if (c.bark || shown.has(c.npcId)) continue;
            const line = info.get(c.npcId).line;
            if (line) this._skipChatter(c.npcId, line, 'full');
        }
        // First frames only: VT323 still loading. A chatter voice waiting stays for the next
        // frame's placement (at most one per NPC; the font promise settles either way)
        if (shown.size && !this._ensureFonts()) return;
        // What bubbles keep off: the HUD panels, every other speaker's head (a bubble over it hid
        // who was talking: R2 m1 retake) and each bubble as it is placed (hard); the player's
        // head (soft)
        const first = order.length ? info.get(order[0]).sprite : null;
        const cam = first?.scene?.cameras?.main || null;
        const view = cam?.worldView || null;
        const head = this._playerHead();
        const heads = new Map();
        for (const id of order) {
            try {
                const a = npcIconAnchor(info.get(id).sprite);
                heads.set(id, { x: a.x - HEAD_HALF_W, y: a.y, w: HEAD_HALF_W * 2, h: HEAD_H, head: id });
            } catch (e) { /* no anchor: nothing to keep clear */ }
        }
        const taken = [...this._hudRects(view, first?.scene), ...(head ? [{ ...head, soft: true }] : [])];
        for (const id of order) {
            const { sprite, line, picture, partnerId, bark } = info.get(id);
            let bb = this.bubbles.get(id);
            if (!bb || !bb.box.scene) { bb = this._make(sprite.scene); this.bubbles.set(id, bb); }
            this._render(bb, line, picture);
            const pos = speechPosition(npcIconAnchor(sprite));
            const others = [...heads].filter(([k]) => k !== id).map(([, r]) => r);
            const place = placeBubble(pos, bb.w, bb.h, [...taken, ...others],
                { prefer: bb.layout, view: sprite.scene?.cameras?.main?.worldView || view });
            if (!place) {
                // No place that covers no other bubble or HUD panel: a bark goes to the toast
                // (from the page on screen), chatter waits for room (R2 m1, m2)
                bb.box.setVisible(false);
                if (bark) this._leave(id, 'no-room');
                else if (line) this._skipChatter(id, line, 'no-room');   // skipped, not waiting (R4 n4)
                continue;
            }
            taken.push(place.rect);
            bb.rect = place.rect;
            this._layout(bb, place);
            const depth = bubbleDepth();   // follows lighting on or off (R4 n2)
            if (bb.box.depth !== depth) bb.box.setDepth(depth);
            bb.box.setPosition(pos.x, pos.y).setVisible(true);
            if (!bark && line) {
                this.chatterShown.set(id, line);
                const v = this.chatterVoice.get(id);
                if (v && v.line === line) this._voiceChatter(id);
            }
            bb.box.setData('line', line);
            bb.box.setData('picture', picture);
            bb.box.setData('partner', partnerId);
            bb.box.setData('bark', bark);
            bb.sayState = bark ? this.says.get(id) || null : null;
        }
        for (const [id, line] of [...this.chatterShown]) {
            if (!shown.has(id) || chatterNow.get(id) !== line) this.chatterShown.delete(id);
        }
        for (const [id, line] of [...this.chatterMust]) {
            if (chatterNow.get(id) !== line) this.chatterMust.delete(id);
        }
        // A voice still waiting was for a line with no bubble to place (off camera, a dark room,
        // a minigame open): it speaks as before. One whose NPC has a bark up, or whose line has
        // ended or been skipped, is dropped.
        for (const [id, v] of [...this.chatterVoice]) {
            const over = !!(sys && mgr) && chatterNow.get(id) !== v.line;
            if (over || this.says.has(id) || this.chatterSkipped.get(id) === v.line) this.chatterVoice.delete(id);
            else this._voiceChatter(id);
        }
    }

    /** Forget the HUD rects, so the next pass reads them again (window or canvas resize, R3 n1). */
    clearHudCache() { this._hud = null; }

    /**
     * The fixed HUD panels on screen, as world rects (hard, for placeBubble): the Objectives
     * panel, the inventory tray, the health and info labels, the music and toggle buttons, the
     * combat buttons, the phone button, the tutorial panel. Read from the DOM at most every
     * HUD_EVERY_MS (getBoundingClientRect forces layout) and mapped through the canvas and the
     * camera's view each frame. Anything hidden, empty or covering most of the screen (a full
     * screen layer) is left out. None without a DOM, a canvas or a view (node tests). R2 m2.
     */

    _hudRects(view, scene = null) {
        if (!view || typeof document === 'undefined') return [];
        // window.game is the main scene; the canvas hangs off its game
        const g = win().game;
        const canvas = scene?.sys?.game?.canvas || g?.sys?.game?.canvas || g?.canvas;
        if (!canvas?.getBoundingClientRect) return [];
        const t = this.now();
        if (!this._hud || t - this._hud.at >= HUD_EVERY_MS || t < this._hud.at) {
            const rects = [];
            const c = canvas.getBoundingClientRect();
            for (const el of document.querySelectorAll(HUD_SELECTORS)) {
                const r = el.getBoundingClientRect?.();
                if (!r || !(r.width > 0) || !(r.height > 0)) continue;
                let cs = null;
                try { cs = win().getComputedStyle?.(el); } catch (e) { cs = null; }
                if (cs && (cs.display === 'none' || cs.visibility === 'hidden' || (cs.opacity !== '' && Number(cs.opacity) === 0))) continue;
                if (r.width * r.height > 0.5 * c.width * c.height) continue;
                rects.push({ left: r.left - c.left, top: r.top - c.top, width: r.width, height: r.height });
            }
            this._hud = { at: t, rects, cw: c.width, ch: c.height };
        }
        const { rects, cw, ch } = this._hud;
        if (!(cw > 0) || !(ch > 0)) return [];
        const kx = view.width / cw, ky = view.height / ch;
        return rects.map(r => ({ x: view.x + r.left * kx - HUD_GAP, y: view.y + r.top * ky - HUD_GAP,
            w: r.width * kx + 2 * HUD_GAP, h: r.height * ky + 2 * HUD_GAP, hud: true }));
    }

    /**
     * Hide the press-to-talk icon of these sprites; show again the ones hidden last frame that
     * interactions.js still holds as visible (player in range).
     */
    _muteTalkIcons(sprites) {
        for (const s of this.talkHidden) {
            if (sprites.has(s)) continue;
            if (s.talkIconVisible && s.interactionIndicator?.scene) s.interactionIndicator.setVisible(true);
        }
        for (const s of sprites) if (s.interactionIndicator?.visible) s.interactionIndicator.setVisible(false);
        this.talkHidden = sprites;
    }
}

/**
 * Run the layer once a frame, after the camera has moved (R2 n2). The bubbles are clamped to the
 * camera's worldView, which the camera only works out in its preRender (follow, lerp, bounds),
 * after postupdate: placed on postupdate, a bubble at an edge sat against last frame's view and
 * showed a few pixels outside it during a pan. So postupdate marks the frame due, and the main
 * camera's preRender runs the pass straight after its own work, before anything is drawn. A
 * paused scene has no postupdate, so its bubbles hold still as before. With no camera to wrap
 * (tests), postupdate runs the pass itself.
 */
export function hookCameraPass(inst, cam) {
    if (!cam || typeof cam.preRender !== 'function') return false;
    if (cam.__bubblePass === inst) return true;
    const orig = cam.__bubbleOrigPreRender || cam.preRender;
    cam.__bubbleOrigPreRender = orig;
    cam.__bubblePass = inst;
    cam.preRender = function (...args) {
        const out = orig.apply(this, args);
        if (inst._due) {
            inst._due = false;
            try { inst.update(); } catch (e) { /* never break a frame */ }
        }
        return out;
    };
    return true;
}

export function installNpcWorldBubbles(scene) {
    const w = win();
    if (!w.npcWorldBubbles) w.npcWorldBubbles = new NpcWorldBubbles();
    const inst = w.npcWorldBubbles;
    // A resize moves the HUD panels: read them again on the next pass, not up to HUD_EVERY_MS
    // later, when a bubble could sit over one for a few frames (R3 n1)
    if (!inst._resizeHooked && typeof w.addEventListener === 'function') {
        inst._resizeHooked = true;
        w.addEventListener('resize', () => inst.clearHudCache());
    }
    if (scene?.scale?.on && inst._scaleHooked !== scene.scale) {
        inst._scaleHooked = scene.scale;
        try { scene.scale.on('resize', () => inst.clearHudCache()); } catch (e) { /* no scale manager */ }
    }
    if (scene?.events && inst.sceneHooked !== scene) {
        inst.sceneHooked = scene;
        // postupdate: after the scene's update() (checkObjectInteractions shows the talk icon
        // there); the pass itself runs in the camera's preRender, once the view is known
        scene.events.on('postupdate', () => {
            let hooked = false;
            try { hooked = hookCameraPass(inst, scene.cameras?.main); } catch (e) { hooked = false; }
            if (hooked) { inst._due = true; return; }
            try { inst.update(); } catch (e) { /* never break a frame */ }
        });
    }
    return inst;
}
