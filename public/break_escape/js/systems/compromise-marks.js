/**
 * Compromise marks (ops core plan 5.4, "The compromised marker in the world"): a PC, device or
 * planted jack the player holds by compromise is drawn tinted light red with a small lightning
 * bolt at its top right.
 *
 * What marks an object (one rule, read by syncRoom, refresh and the event handlers):
 *   technique  a session copy with via 'technique' whose window.pcSessions.remoteViewFoothold(id)
 *              is not null (the foothold is still held)
 *   implant    a window.networkLinks foothold with via 'implant' and sourceId the object's id
 *   jack       a foothold with via 'jack' and that sourceId
 * Not marked: password, credential, claim and relay sessions, a joined Wi-Fi access point, a
 * share. An NPC sitting down or finishing a borrow changes nothing here.
 *
 * Event driven, never polled (no timer): on pc_signed_in, pc_signed_out, network_foothold_gained,
 * network_device_unplugged and network_foothold_dropped refresh() re-reads every sprite's
 * sources; syncRoom(roomId) does the same for the sprites of a room just made (core/rooms.js).
 *
 * Drawing: the tint is `sprite.compromiseTint` (0xff8a8a) applied with setTint, and
 * interactions.js and the fingerprint view rest at that property (their local restTint). A
 * sprite with an authored tint or spriteVariants keeps its look and gets only the bolt: no
 * property is set. The property is set or deleted at once, but setTint/clearTint are called only
 * while the sprite is not highlighted (isHighlighted false), so a change during a hover shows
 * when the hover ends. The bolt (utils/compromise-bolt.js, drawn in code) is its own image at the
 * sprite's top right, one depth above it.
 *
 * list() is `[{ objectId, sources: [{ kind, footholdId }], tint }]`, `tint` the sprite's live
 * tintTopLeft read at call time (null for a sprite that keeps an authored look); the test
 * bridge's window.__test.access.compromiseMarks() returns it.
 */

import { createBoltCanvas } from '../utils/compromise-bolt.js';

export const MARK_TINT = 0xff8a8a;
export const BOLT_TEXTURE_KEY = 'compromise_bolt';

const win = () => (typeof window !== 'undefined' ? window : {});

const EVENTS = ['pc_signed_in', 'pc_signed_out', 'network_foothold_gained', 'network_device_unplugged', 'network_foothold_dropped'];

/** True when the sprite's look is the author's: a scenario tint or its own spriteVariants. */
function keepsAuthoredLook(sprite) {
    if (Array.isArray(sprite?.scenarioData?.spriteVariants) && sprite.scenarioData.spriteVariants.length) return true;
    if (sprite?.scenarioData?.tint !== undefined && sprite.scenarioData.tint !== null) return true;
    // A tint the sprite already carries that this module did not put there (the proximity highlight's blue is not one)
    return sprite?.isTinted === true && sprite.compromiseTint === undefined && sprite.isHighlighted !== true;
}

export class CompromiseMarks {
    constructor() {
        this.marks = new Map(); // sprite -> { objectId, sources, bolt, applied }
        this._listening = null;
    }

    /** The sources that mark objectId now: `[{ kind, footholdId }]`, empty when none. */
    sourcesOf(objectId) {
        const w = win();
        const out = [];
        if (!objectId) return out;
        const fh = w.pcSessions?.remoteViewFoothold?.(objectId);
        if (fh) out.push({ kind: 'technique', footholdId: fh });
        const list = typeof w.networkLinks?.list === 'function' ? w.networkLinks.list() : [];
        for (const f of list) {
            if (!f || f.sourceId !== objectId) continue;
            if (f.via === 'implant') out.push({ kind: 'implant', footholdId: f.id });
            else if (f.via === 'jack') out.push({ kind: 'jack', footholdId: f.id });
        }
        return out;
    }

    _sprites(roomId = null) {
        const rooms = win().rooms || {};
        const ids = roomId === null ? Object.keys(rooms) : [roomId];
        const out = [];
        for (const id of ids) {
            for (const sprite of Object.values(rooms[id]?.objects || {})) {
                if (sprite && sprite.active !== false && sprite.scenarioData?.id) out.push(sprite);
            }
        }
        return out;
    }

    /** Bring one sprite into line with its sources. */
    _sync(sprite) {
        const sources = this.sourcesOf(sprite.scenarioData?.id);
        if (sources.length === 0) { this._unmark(sprite); return; }
        const held = this.marks.get(sprite);
        if (held) { held.sources = sources; return; }
        const entry = { objectId: sprite.scenarioData.id, sources, bolt: null, applied: false };
        if (!keepsAuthoredLook(sprite)) {
            sprite.compromiseTint = MARK_TINT;
            entry.applied = true;
            if (!sprite.isHighlighted && typeof sprite.setTint === 'function') sprite.setTint(MARK_TINT);
        }
        entry.bolt = this._makeBolt(sprite);
        this.marks.set(sprite, entry);
    }

    _unmark(sprite) {
        const entry = this.marks.get(sprite);
        if (!entry) return;
        this.marks.delete(sprite);
        if (entry.applied) {
            delete sprite.compromiseTint;
            if (!sprite.isHighlighted && typeof sprite.clearTint === 'function') sprite.clearTint();
        }
        entry.bolt?.destroy?.();
    }

    /** The bolt image at the sprite's top right, one depth above it; null when it cannot be drawn. */
    _makeBolt(sprite) {
        const scene = sprite.scene;
        if (!scene?.add?.image || !scene.textures) return null;
        if (!scene.textures.exists?.(BOLT_TEXTURE_KEY)) {
            const canvas = createBoltCanvas(typeof document !== 'undefined' ? document : null, 1);
            if (!canvas || typeof scene.textures.addCanvas !== 'function') return null;
            scene.textures.addCanvas(BOLT_TEXTURE_KEY, canvas);
        }
        const w = sprite.displayWidth ?? sprite.width ?? 0;
        const h = sprite.displayHeight ?? sprite.height ?? 0;
        const ox = sprite.originX ?? 0.5;
        const oy = sprite.originY ?? 0.5;
        const image = scene.add.image(sprite.x + w * (1 - ox), sprite.y - h * oy, BOLT_TEXTURE_KEY);
        image.setOrigin?.(1, 0);
        image.setDepth?.((sprite.depth ?? 0) + 1);
        return image;
    }

    /** Re-read every sprite's sources: marks whose source is gone come off, new ones go on. */
    refresh() {
        for (const sprite of [...this.marks.keys()]) {
            if (sprite.active === false) this._unmark(sprite);
        }
        for (const sprite of this._sprites()) this._sync(sprite);
    }

    /** Silent pass over one room's sprites, called once they are made (core/rooms.js). */
    syncRoom(roomId) {
        for (const sprite of this._sprites(roomId)) this._sync(sprite);
    }

    /** The applied marks, with each sprite's live tint. */
    list() {
        return [...this.marks.entries()].map(([sprite, m]) => ({
            objectId: m.objectId,
            sources: m.sources.map(s => ({ ...s })),
            tint: m.applied ? (sprite.tintTopLeft ?? null) : null
        }));
    }

    /** Listen for the events that change a source, then a pass over every loaded room. */
    install() {
        const dispatcher = win().eventDispatcher;
        if (dispatcher && typeof dispatcher.on === 'function' && this._listening !== dispatcher) {
            this._listening = dispatcher;
            for (const name of EVENTS) dispatcher.on(name, () => this.refresh());
        }
        this.refresh();
        return this;
    }
}

/** Build and install the live instance. Idempotent. */
export function installCompromiseMarks() {
    const w = win();
    if (w.compromiseMarks) return w.compromiseMarks;
    w.compromiseMarks = new CompromiseMarks().install();
    return w.compromiseMarks;
}
