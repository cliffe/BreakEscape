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
 *   - Bubbles never cover each other or the player's head: each is placed in turn (barks first,
 *     nearest first) centred, then slid left or right of its NPC (the tail stays over the head),
 *     then lifted above what it would cover, with a 2 px stem down to the head (R1 n4).
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
const FILL = 0xffffff;
const LINE = 0x1b2a41;

const win = () => (typeof window !== 'undefined' ? window : {});

// ---- pure helpers ----

/** Pure: may this NPC's bubble show at all? */
export function speechShown({ npcRoom, playerRoom, dark = false, minigameOpen = false }) {
    return !minigameOpen && iconShown({ npcRoom, playerRoom, dark });
}

/**
 * Pure: which of the candidate speakers get a bubble: at most `max`; barks (`bark: true`) before
 * chatter, then nearest the player first, ties by id. `list` items are { npcId, distance, bark }.
 */
export function pickShown(list, max = MAX_BUBBLES) {
    return [...list]
        .sort((a, b) => (b.bark ? 1 : 0) - (a.bark ? 1 : 0)
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
 * Pure: where a bubble of `w` by `h` (body, not counting the tail) sits over the head anchor
 * `at` so it covers none of `taken` (rects { x, y, w, h } of bubbles already placed and the
 * player's head). Tries centred, then slid left, then slid right (the tail stays over the head),
 * then lifts above the lowest thing in the way and tries again. `prefer` (last frame's choice)
 * is tried first at each lift, so a bubble does not flip sides from frame to frame.
 * Returns { dx, lift, rect }: dx shifts the body sideways, lift raises body and tail.
 */
export function placeBubble(at, w, h, taken, { prefer = null, tail = TAIL, maxLifts = 3 } = {}) {
    const slide = Math.max(0, Math.floor(w / 2) - TAIL_HALF);
    let order = [0, -slide, slide];
    if (prefer && order.includes(prefer.dx)) order = [prefer.dx, ...order.filter(d => d !== prefer.dx)];
    const rectFor = (dx, lift) => ({ x: at.x + dx - w / 2, y: at.y - lift - tail - h, w, h: h + tail });
    let lift = 0;
    let last = null;
    for (let i = 0; i <= maxLifts; i++) {
        let lowestTop = null;
        for (const dx of order) {
            const rect = rectFor(dx, lift);
            const hit = taken.filter(t => overlaps(rect, t));
            if (hit.length === 0) return { dx, lift, rect };
            for (const t of hit) lowestTop = lowestTop === null ? t.y : Math.max(lowestTop, t.y);
            last = { dx: order[0], lift, rect: rectFor(order[0], lift) };
        }
        // Lift the centred body so its bottom (tail tip) clears the top of the lowest thing hit
        const need = at.y - lowestTop + 2;
        lift = Math.max(lift + 2, need);
        if (lift % 2) lift += 1;
    }
    return last;
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

/** Pure: the line in pages of at most `perPage` wrapped lines; each page is its lines joined by "\n". */
export function pageLine(text, { width = LINE_CHARS, perPage = PAGE_LINES } = {}) {
    const lines = wrapLines(text, width);
    const pages = [];
    for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage).join('\n'));
    return pages;
}

/** Pure: a page (or pages) as plain one-line text: the words joined by single spaces. */
export function pagesText(pages) {
    return pages.join(' ').split(/\s+/).filter(Boolean).join(' ');
}

const wordsIn = (s) => String(s).split(/\s+/).filter(Boolean).length;

/** Pure: each page's share of `totalMs` by word count, at least `minMs` a page. */
export function pageTimes(pages, totalMs, minMs = PAGE_MIN_MS) {
    const counts = pages.map(wordsIn);
    const all = counts.reduce((s, n) => s + n, 0) || 1;
    return counts.map(n => Math.max(minMs, Math.round(totalMs * n / all)));
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
        const box = scene.add.container(0, 0, [g, text, img]).setDepth(5001);
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
     * 2 px stem down to the head.
     */
    _drawFrame(g, w, h, dx = 0, lift = 0) {
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
    _layout(bb, { dx = 0, lift = 0 } = {}) {
        if (bb.layout && bb.layout.dx === dx && bb.layout.lift === lift) return;
        bb.layout = { dx, lift };
        const { w, h } = bb;
        const left = dx - w / 2 + BORDER_PX + PAD_X - (bb.inkLeft || 0);
        const top = -lift - TAIL - h + BORDER_PX + PAD_Y;
        bb.text.setPosition(left, top);
        bb.img.setPosition(Math.round(dx - PICTURE_PX / 2), top);
        this._drawFrame(bb.g, w, h, dx, lift);
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
            minigameOpen: !!win().MinigameFramework?.currentMinigame,
            onCamera: live ? this._onCamera(sprite) : false
        };
    }

    _inView(npcId) {
        const f = this.viewFacts(npcId);
        return f.hasSprite && f.onCamera && speechShown(f);
    }

    /** Is a bark bubble up for this NPC now? (npc-action-icons.js hides its icons meanwhile.) */
    hasLine(npcId) { return this.says.has(npcId); }

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
     */
    say(npcId, line, { audioMs = null, onRemainder = null, onDone = null, stillValid = null } = {}) {
        const pages = pageLine(line);
        if (!npcId || pages.length === 0) return null;
        if (!this._inView(npcId)) return null;
        const { sprite } = this._spriteAndRoom(npcId);
        const distance = this._distance(sprite);
        // A new line from the same NPC replaces its old one (its voice was cut too)
        if (this.says.has(npcId)) this._end(npcId, 'replaced');
        const others = [...this.says.keys()].map(id => ({ npcId: id, distance: this._distance(this._spriteAndRoom(id).sprite) }));
        const cap = barkCapacity(others, distance);
        if (!cap.ok) { this._note(npcId, 'full'); return null; }
        if (cap.evict) this._leave(cap.evict, 'pushed');
        const reading = readingMs(line);
        const st = {
            npcId, line, pages, page: 0, started: this.now(), pageStarted: this.now(),
            times: pageTimes(pages, lineTotalMs({ audioMs, readingMs: reading })),
            audioMs: audioMs > 0 ? audioMs : null, onRemainder, onDone,
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
        const times = pageTimes(st.pages, lineTotalMs({ audioMs: ms, readingMs: 0 }));
        for (let i = st.page + 1; i < st.pages.length; i++) st.times[i] = times[i];
        this._note(st.npcId, 'audio', { ms });
    }

    _end(npcId, why) {
        const st = this.says.get(npcId);
        if (!st) return;
        this.says.delete(npcId);
        const bb = this.bubbles.get(npcId);
        if (bb) { bb.box.setVisible(false); bb.line = null; }
        this._note(npcId, why, { page: st.page });
        if (why === 'done') { try { st.onDone?.(); } catch (e) { /* never break a frame */ } }
    }

    /** Left view (or pushed out): close, and hand the rest of the line, this page onwards, on. */
    _leave(npcId, why) {
        const st = this.says.get(npcId);
        if (!st) return;
        const rest = pagesText(st.pages.slice(st.page));
        this._end(npcId, why);
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
        this._tickSays();
        const sys = win().npcNeedsSystem;
        const mgr = win().npcBehaviorManager;
        const playerRoom = win().currentPlayerRoom;
        const minigameOpen = !!win().MinigameFramework?.currentMinigame;
        const cands = [];
        const info = new Map();
        for (const st of this.says.values()) {
            const { sprite } = this._spriteAndRoom(st.npcId);
            cands.push({ npcId: st.npcId, distance: this._distance(sprite), bark: true });
            info.set(st.npcId, { sprite, line: st.pages[st.page], picture: null, partnerId: null, bark: true });
        }
        if (sys && mgr) {
            for (const id of sys.states.keys()) {
                if (info.has(id)) continue;   // a bark wins over the same NPC's chatter
                const st = sys.getState(id);
                if (!st?.talking) continue;
                const b = mgr.getBehavior?.(id);
                const sprite = b?.sprite;
                if (!sprite || !sprite.active || !sprite.visible || sprite.destroyed) continue;
                if (!speechShown({ npcRoom: b.roomId, playerRoom, dark: roomIsDark(b.roomId), minigameOpen })) continue;
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
        if (shown.size && !this._ensureFonts()) return;   // first frames only: VT323 still loading
        const head = this._playerHead();
        const taken = head ? [head] : [];
        for (const id of order) {
            const { sprite, line, picture, partnerId, bark } = info.get(id);
            let bb = this.bubbles.get(id);
            if (!bb || !bb.box.scene) { bb = this._make(sprite.scene); this.bubbles.set(id, bb); }
            this._render(bb, line, picture);
            const pos = speechPosition(npcIconAnchor(sprite));
            const place = placeBubble(pos, bb.w, bb.h, taken, { prefer: bb.layout });
            taken.push(place.rect);
            this._layout(bb, place);
            bb.box.setPosition(pos.x, pos.y).setVisible(true);
            bb.box.setData('line', line);
            bb.box.setData('picture', picture);
            bb.box.setData('partner', partnerId);
            bb.box.setData('bark', bark);
        }
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

export function installNpcWorldBubbles(scene) {
    const w = win();
    if (!w.npcWorldBubbles) w.npcWorldBubbles = new NpcWorldBubbles();
    const inst = w.npcWorldBubbles;
    if (scene?.events && inst.sceneHooked !== scene) {
        inst.sceneHooked = scene;
        // postupdate: after the scene's update() (checkObjectInteractions shows the talk icon there)
        scene.events.on('postupdate', () => { try { inst.update(); } catch (e) { /* never break a frame */ } });
    }
    return inst;
}
