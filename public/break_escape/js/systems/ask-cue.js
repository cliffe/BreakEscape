/**
 * Colleague-asks-you cue (the awareness course's step-away beat, shared by every shell).
 *
 * An event mapping with `whenPerceivable: true` waits to fire until the player could actually
 * notice it (no minigame or conversation open, and the NPC on camera or in the player's room).
 * One with `askCue: true` also shows the cue when it fires: a pixel-art "!" marker over the
 * colleague (drawn from rectangles, 2 px border, no font) and a short toast, built from the
 * NPC's displayName. UI text only, never speech. The reply clock is a timer that starts on the
 * `asked` global, which the same mapping sets, so the clock starts when the cue does.
 *
 * Installed as window.askCue by core/game.js; npc-manager.js reads it through the window, so
 * it has no static import of this file.
 */

/** Default length of the reply window (ms), written into the kit timers by office_kit.py. */
export const DEFAULT_REPLY_MS = 45000;
/** How long the marker stays over the colleague (the reply window). */
export const CUE_MARKER_MS = DEFAULT_REPLY_MS;
/**
 * Marker: 2 px border, a dark fill and a light "!" (pixel art, never scaled). 18x24 (was 11x15,
 * which a tester missed); the white border on the dark fill and a yellow "!" 4 px wide keep the
 * contrast high. `bars` are the "!" rectangles as [x, y, w, h] inside the box.
 */
export const MARKER = Object.freeze({
    w: 18, h: 24, border: 2, fill: 0x1a1a2e, edge: 0xffffff, bang: 0xffd23f,
    bars: Object.freeze([[7, 5, 4, 10], [7, 17, 4, 4]])
});

/**
 * Pure: the marker's top-left for this sprite. Its bottom edge sits 2 px above the asker's head:
 * the frame top (y - displayHeight * originY) moved down by `headInset`, the empty rows above the
 * figure in its current frame, scaled. A seated figure sits lower in its 80 px frame than a
 * standing one, so a frame-top anchor alone left a gap over a seated asker. The old placement
 * subtracted the whole displayHeight from the centre, a half frame higher still (re-gate minor,
 * 22 Nov).
 */
export function markerPosition(sprite, bob = 0, { w = MARKER.w, h = MARKER.h, headInset = 0 } = {}) {
    const dh = sprite.displayHeight || 48;
    const oy = sprite.originY ?? 0.5;
    const headTop = sprite.y - dh * oy + headInset;
    return { x: Math.round(sprite.x - w / 2), y: Math.round(headTop - h - 2 + bob) };
}

// Empty rows above the figure in a texture frame, measured once per frame and cached.
const headRows = new Map();
/**
 * Rows of transparent pixels above the first opaque one in this sprite's current frame, in
 * texture pixels (0 when the texture manager cannot be read, as in tests). `alphaAt` is
 * textures.getPixelAlpha(x, y, key, frame).
 */
export function headRowsFor(sprite, alphaAt) {
    const key = sprite?.texture?.key, frame = sprite?.frame;
    if (!key || !frame || typeof alphaAt !== 'function') return 0;
    const id = `${key}|${frame.name}`;
    if (headRows.has(id)) return headRows.get(id);
    let rows = 0;
    try {
        const fw = frame.realWidth || frame.width, fh = frame.realHeight || frame.height;
        search: for (let y = 0; y < fh; y++) {
            for (let x = 0; x < fw; x++) if ((alphaAt(x, y, key, frame.name) || 0) > 0) { rows = y; break search; }
            rows = y + 1;
        }
        if (rows >= fh) rows = 0; // an empty frame: keep the frame-top anchor
    } catch (e) { rows = 0; }
    headRows.set(id, rows);
    return rows;
}

/**
 * Pure: could the player notice something happening at this NPC now? `facts` is
 * npcWorldBubbles.viewFacts(npcId): { hasSprite, npcRoom, playerRoom, minigameOpen, onCamera }.
 * No facts (no bubble layer yet) counts as perceivable unless a minigame is open.
 */
export function askPerceivable(facts) {
    if (!facts) return true;
    if (facts.minigameOpen) return false;
    if (!facts.hasSprite) return false;
    return facts.onCamera === true || (!!facts.npcRoom && facts.npcRoom === facts.playerRoom);
}

/** Pure: the toast text for a colleague's ask. */
export function askToastText(name) {
    const n = (typeof name === 'string' && name.trim()) || 'Someone';
    return `${n} is asking you something`;
}

const win = () => (typeof window !== 'undefined' ? window : {});

export class AskCue {
    constructor(scene = null) {
        this.scene = scene;
        this.markers = new Map();   // npcId -> { gfx, timer, off }
    }

    /** Is the ask perceivable at this NPC right now? */
    perceivable(npcId) {
        let facts = null;
        try { facts = win().npcWorldBubbles?.viewFacts?.(npcId) || null; } catch (e) { facts = null; }
        if (!facts) return !win().MinigameFramework?.currentMinigame;
        return askPerceivable(facts);
    }

    /**
     * Show the toast and the marker for this NPC. Returns the toast text. `ms` is the reply window
     * (the marker's longest life). `until` names the piece's choice global: the marker then stays
     * until that global leaves '' (answered, or the reply clock lapsed), not until any conversation
     * with the colleague closes, and is not drawn at all if it has already left ''.
     */
    fire(npcId, { ms = CUE_MARKER_MS, until = null, quiet = false } = {}) {
        const w = win();
        const name = w.npcManager?.getNPC?.(npcId)?.displayName || npcId;
        const text = askToastText(name);
        // quiet: a reload restoring the marker of an ask already toasted before it
        if (!quiet) { try { w.showNotification?.(text, 'info', 'Colleague', 6000); } catch (e) { /* cosmetic */ } }
        try { this._mark(npcId, ms, until); } catch (e) { console.debug('[ask-cue] marker failed', e); }
        return text;
    }

    clear(npcId) {
        const m = this.markers.get(npcId);
        if (!m) return;
        clearTimeout(m.timer);
        try { m.off?.(); } catch (e) { /* gone */ }
        try { m.gfx?.destroy?.(); } catch (e) { /* gone */ }
        this.markers.delete(npcId);
    }

    _sprite(npcId) {
        const w = win();
        const b = w.npcBehaviorManager?.getBehavior?.(npcId);
        if (b?.sprite) return b.sprite;
        for (const room of Object.values(w.rooms || {})) {
            const s = room?.npcSprites?.find?.(x => x.npcId === npcId);
            if (s) return s;
        }
        return null;
    }

    _mark(npcId, ms, until = null) {
        this.clear(npcId);
        if (until && (win().gameState?.globalVariables?.[until] ?? '') !== '') return;
        const sprite = this._sprite(npcId);
        const scene = sprite?.scene || this.scene;
        if (!sprite || !scene?.add?.graphics) return;
        const { w, h, border, fill, edge, bang, bars } = MARKER;
        const g = scene.add.graphics();
        g.fillStyle(edge, 1).fillRect(0, 0, w, h);
        g.fillStyle(fill, 1).fillRect(border, border, w - 2 * border, h - 2 * border);
        g.fillStyle(bang, 1);
        for (const [bx, by, bw, bh] of bars) g.fillRect(bx, by, bw, bh);
        g.setDepth((sprite.depth || 0) + 1000);
        const place = () => {
            if (!sprite.active || sprite.destroyed) { this.clear(npcId); return; }
            const bob = Math.round(Math.sin(scene.time.now / 180) * 2);
            const tm = scene.textures;
            const rows = headRowsFor(sprite, tm?.getPixelAlpha ? tm.getPixelAlpha.bind(tm) : null);
            const p = markerPosition(sprite, bob, { headInset: rows * (sprite.scaleY || 1) });
            g.setPosition(p.x, p.y);
            // a panel covers the world: hide the marker while one is open, show it again after
            g.setVisible(!win().MinigameFramework?.currentMinigame);
        };
        place();
        scene.events.on('postupdate', place);
        const done = () => this.clear(npcId);
        const ev = win().eventDispatcher;
        // Without a choice global the marker goes when a conversation with the colleague closes (the
        // old rule). With one it goes when the piece's answer is recorded: a conversation that closes
        // unanswered leaves the reply clock running, so the marker stays for it.
        const gone = until ? `global_variable_changed:${until}` : `conversation_closed:${npcId}`;
        const onGone = until ? (p) => { if ((p?.value ?? '') !== '') done(); } : done;
        try { ev?.on?.(gone, onGone); } catch (e) { /* no dispatcher */ }
        const timer = setTimeout(done, ms);
        this.markers.set(npcId, {
            gfx: g, timer,
            off: () => { scene.events?.off?.('postupdate', place); try { ev?.off?.(gone, onGone); } catch (e) { /* ok */ } }
        });
    }
}

export function installAskCue(scene) {
    const w = win();
    if (!w.askCue) w.askCue = new AskCue(scene);
    else w.askCue.scene = scene;
    return w.askCue;
}
