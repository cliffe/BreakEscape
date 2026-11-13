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

    /** Draw the frame: 2 px border, stepped corners, stepped tail; whole pixels only. */
    _drawFrame(g, w, h) {
        const x = -w / 2, y = -TAIL - h, b = BORDER_PX;
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
        const by = -TAIL;                                // box bottom edge
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
    }

    _render(bb, line, picture = null) {
        const tex = picture ? pictureTexture(picture) : null;
        const ready = !!(tex && bb.box.scene && this._textureReady(bb.box.scene, tex));
        const sig = picture ? `pic:${picture}:${ready}` : line;
        if (bb.line === sig) return;
        bb.line = sig;
        bb.picture = picture;
        bb.img.setVisible(ready);
        if (ready) bb.img.setTexture(tex.key);
        const shown = picture ? (ready ? '' : '…') : String(line ?? '');
        // Chatter lines wrap the same way; a bark page is already wrapped
        bb.text.setText(shown.includes('\n') ? shown : wrapLines(shown).join('\n'));
        const cw = ready ? PICTURE_PX : Math.ceil(bb.text.width);
        const ch = ready ? PICTURE_PX : Math.ceil(bb.text.height);
        let w = cw + PAD_X * 2 + BORDER_PX * 2;
        if (w % 2) w += 1;                               // even, so -w/2 is a whole pixel
        const h = ch + PAD_Y * 2 + BORDER_PX * 2;
        const left = -w / 2 + BORDER_PX + PAD_X;
        const top = -TAIL - h + BORDER_PX + PAD_Y;
        bb.text.setPosition(left, top);
        bb.img.setPosition(Math.round(-PICTURE_PX / 2), top);
        this._drawFrame(bb.g, w, h);
        bb.w = w; bb.h = h;
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

    /** The facts npc-barks.js routeBark() needs for this NPC, read now. */
    viewFacts(npcId) {
        const { sprite, roomId } = this._spriteAndRoom(npcId);
        const live = !!(sprite && sprite.active !== false && sprite.visible !== false && !sprite.destroyed);
        return {
            hasSprite: live,
            npcRoom: roomId,
            playerRoom: win().currentPlayerRoom,
            dark: roomId ? roomIsDark(roomId) : false,
            minigameOpen: !!win().MinigameFramework?.currentMinigame
        };
    }

    _inView(npcId) {
        const f = this.viewFacts(npcId);
        return f.hasSprite && speechShown(f);
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
     */
    say(npcId, line, { audioMs = null, onRemainder = null, onDone = null } = {}) {
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
            audioMs: audioMs > 0 ? audioMs : null, onRemainder, onDone
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
        const shown = new Set(pickShown(cands));
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
        for (const id of shown) {
            const { sprite, line, picture, partnerId, bark } = info.get(id);
            let bb = this.bubbles.get(id);
            if (!bb || !bb.box.scene) { bb = this._make(sprite.scene); this.bubbles.set(id, bb); }
            this._render(bb, line, picture);
            const pos = speechPosition(npcIconAnchor(sprite));
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
