/**
 * NPC office visuals (OFFICE_LIFE_PLAN 2.12, slice 3): what the player sees and hears of the
 * needs system that the action icons do not cover.
 *
 *   Held items  A carried item stays visible and follows its NPC at a hand offset per facing
 *               (in front at hip height facing south, east or west; behind the body facing
 *               north). Runs on the scene's `postupdate`, after NPCs have moved and set their
 *               depth, so it never trails a frame. Visible exactly when the NPC sprite is.
 *   Use sounds  An object's `affordance.useSound` plays as a one-shot when an NPC's use of it
 *               completes (`npc_used:<id>`), at effects volume x 0.4 x a linear fall-off to zero
 *               at eight tiles x the room's hearing level (own room 1, through a door 0.4, else
 *               0). At most one NPC use sound per second overall. Played with
 *               scene.sound.play, not soundManager.play (which reuses one sound per key and
 *               would restart the player's own gulp). An audible one emits
 *               `npc_use_heard:<objectId>` { npcId, key, volume, hearing }.
 *
 * Scenario: `"officeVisuals": false` turns this layer off (carried items are hidden again, as
 * before slice 3, and no use sounds play). The sprite action icons and their room/dark rule are
 * in npc-action-icons.js; the seated typing bob is in seating.js.
 */
import { TILE_SIZE } from '../utils/constants.js';
import { hearingLevel } from './room-hearing.js';

export const USE_SOUND_SCALE = 0.4;
export const HEAR_TILES = 8;
export const SOUND_GAP_MS = 1000;
const DARK_LEVEL = 0.5;   // lighting.js GLOW_ABOVE_LEVEL: below this a room reads as dark

const win = () => (typeof window !== 'undefined' ? window : {});

/** Is the layer on for this scenario? On unless the scenario says `"officeVisuals": false`. */
export function officeVisualsOn(scenario = win().gameScenario) {
    return scenario?.officeVisuals !== false;
}

/** Pure: a use sound's volume. `distance` in px from the player; `hearing` 0..1. */
export function useVolume({ effects = 1, distance = 0, hearing = 1 } = {}) {
    const reach = HEAR_TILES * TILE_SIZE;
    const fall = Math.max(0, 1 - Math.max(0, distance) / reach);
    return Math.max(0, effects * USE_SOUND_SCALE * fall * hearing);
}

/** At most one sound per `gapMs` overall. */
export class SoundLimiter {
    constructor(gapMs = SOUND_GAP_MS) { this.gapMs = gapMs; this.last = -Infinity; }
    allow(now) {
        if (now - this.last < this.gapMs) return false;
        this.last = now;
        return true;
    }
}

// Hand offsets from the NPC sprite's centre, in px. Atlas frames are 80 px with the figure's
// hips about 6 px below the centre; `front` draws the item just above the NPC, else just below.
const HAND = {
    'down':       { dx: 7,  dy: 6, front: true },
    'down-right': { dx: 8,  dy: 6, front: true },
    'right':      { dx: 9,  dy: 6, front: true },
    'up-right':   { dx: 8,  dy: 4, front: false },
    'up':         { dx: -7, dy: 4, front: false },
    'up-left':    { dx: -8, dy: 4, front: false },
    'left':       { dx: -9, dy: 6, front: true },
    'down-left':  { dx: -8, dy: 6, front: true }
};

/** Pure: the hand offset for a facing (NPC behaviour `direction`); unknown facings use 'down'. */
export function handOffset(direction) {
    return HAND[direction] || HAND.down;
}

/**
 * Pure: where a held item goes. `npc` is { x, y, depth, visible }, `item` { displayWidth,
 * displayHeight, originX, originY }. Returns { x, y, depth, visible }: the item's centre on the
 * hand point, whatever its origin.
 */
export function heldPlacement(npc, item, direction) {
    const h = handOffset(direction);
    const w = item.displayWidth || 0, ht = item.displayHeight || 0;
    const ox = item.originX ?? 0.5, oy = item.originY ?? 0.5;
    const cx = npc.x + h.dx, cy = npc.y + h.dy;
    return {
        x: Math.round(cx - w / 2 + w * ox),
        y: Math.round(cy - ht / 2 + ht * oy),
        depth: (npc.depth || 0) + (h.front ? 0.02 : -0.02),
        visible: !!npc.visible
    };
}

/** Is a room dark? A room the lighting system does not manage (or no lighting) counts as lit. */
export function roomIsDark(roomId, lighting = win().lightingSystem) {
    const state = lighting?.rooms?.get?.(roomId);
    if (!state || typeof lighting.roomLevel !== 'function') return false;
    return lighting.roomLevel(state) < DARK_LEVEL;
}

/**
 * Pure: may an NPC's icon or bubble show? Only in the player's current room, and not while that
 * room is dark (OFFICE_LIFE_PLAN 2.12, "Where any of this shows").
 */
export function iconShown({ npcRoom, playerRoom, dark = false }) {
    return !!npcRoom && npcRoom === playerRoom && !dark;
}

// ---- head top, for the action icon (npc-action-icons.js) ----
// Character frames are 80 px with empty canvas above the head (the head starts about row 13-15,
// standing or seated), so the frame's top is not the head's. The icon sits ICON_HEAD_GAP px
// above the first opaque row of the frame on screen.
export const ICON_HEAD_GAP = 2;
const FALLBACK_TOP_DY = 6;   // no pixel data (a canvas-less test, a failed read): the old offset
const headRows = new Map();  // `${textureKey}|${frameName}` -> first opaque row (untrimmed frame px) or null

/** Pure: the first row with any alpha > 0 in a w x h frame, or null for a blank frame. */
export function firstOpaqueRow(alphaAt, w, h) {
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) if (alphaAt(x, y) > 0) return y;
    }
    return null;
}

/** First opaque row of a sprite's current frame, read once per texture and frame from its source image. */
export function frameHeadRow(sprite) {
    const fr = sprite?.frame;
    const key = sprite?.texture?.key;
    if (!fr || !key) return null;
    const ck = `${key}|${fr.name}`;
    if (headRows.has(ck)) return headRows.get(ck);
    let row = null;
    try {
        const img = fr.source?.image;
        const w = fr.cutWidth, h = fr.cutHeight;
        const doc = typeof document !== 'undefined' ? document : null;
        if (img && doc && w > 0 && h > 0) {
            const c = doc.createElement('canvas');
            c.width = w; c.height = h;
            const ctx = c.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h).data;
            const r = firstOpaqueRow((x, y) => data[(y * w + x) * 4 + 3], w, h);
            // A trimmed atlas frame starts lower on the untrimmed canvas
            if (r !== null) row = r + (fr.data?.trim ? (fr.data.spriteSourceSize?.y || 0) : 0);
        }
    } catch (e) { row = null; }
    headRows.set(ck, row);
    return row;
}

/**
 * Pure: the icon's anchor (its bottom centre). `top` is the sprite's top centre on screen
 * (getTopCenter), `row` the frame's first opaque row, `scaleY` the sprite's vertical scale.
 */
export function iconAnchor(top, row, scaleY = 1, gap = ICON_HEAD_GAP) {
    if (row === null || row === undefined) return { x: Math.round(top.x), y: Math.round(top.y + FALLBACK_TOP_DY) };
    return { x: Math.round(top.x), y: Math.round(top.y + row * Math.abs(scaleY || 1) - gap) };
}

/** The anchor for a live NPC sprite: just above its head, seated or standing. */
export function npcIconAnchor(sprite) {
    const top = sprite.getTopCenter ? sprite.getTopCenter() : { x: sprite.x, y: sprite.y - 40 };
    return iconAnchor(top, frameHeadRow(sprite), sprite.scaleY);
}

export class NpcOfficeVisuals {
    constructor(scene = null) {
        this.scene = scene;
        this.limiter = new SoundLimiter();
        this.playLog = [];   // [{ t, key, npcId, objectId, roomId, distance, hearing, volume, played }] for live checks
    }

    /** Per frame (postupdate): carried items follow their NPC. */
    followHeld() {
        const sys = win().npcNeedsSystem;
        const mgr = win().npcBehaviorManager;
        const npcMgr = win().npcManager;
        if (!sys || !mgr) return;
        for (const [id, st] of sys.states) {
            if (!st.job?.carrying) continue;
            const held = npcMgr?.getNPC?.(id)?._needsCarried?.[st.job.itemId];
            const sp = held?.sprite;
            const b = mgr.getBehavior?.(id);
            const npc = b?.sprite;
            if (!sp || sp.destroyed || !npc) continue;
            const p = heldPlacement({ x: npc.x, y: npc.y, depth: npc.depth, visible: npc.visible && npc.active },
                sp, b.direction);
            if (sp.x !== p.x || sp.y !== p.y) sp.setPosition ? sp.setPosition(p.x, p.y) : (sp.x = p.x, sp.y = p.y);
            sp.setDepth?.(p.depth);
            if (sp.visible !== p.visible) sp.setVisible?.(p.visible);
        }
    }

    /**
     * Play a one-shot at a world point in a room. Returns the volume played (0 when not heard,
     * rate-limited or unavailable).
     */
    playAt(key, x, y, roomId, meta = {}) {
        const scene = this.scene;
        const w = win();
        const sm = w.soundManager;
        if (!key || !scene?.sound) return 0;
        const player = w.player;
        const distance = player ? Math.hypot(player.x - x, player.y - y) : Infinity;
        const hearing = hearingLevel(roomId);
        const effects = sm ? (sm.volumeSettings?.effects ?? 1) * (sm.masterVolume ?? 1) : 1;
        const volume = useVolume({ effects, distance, hearing });
        const entry = { t: Date.now(), key, roomId, distance: Math.round(distance), hearing, volume: Math.round(volume * 1000) / 1000, played: false, ...meta };
        this.playLog.push(entry);
        if (this.playLog.length > 200) this.playLog.shift();
        if (volume <= 0 || (sm && sm.enabled === false) || scene.sound.mute) return 0;
        if (scene.cache?.audio && !scene.cache.audio.exists(key)) { entry.reason = 'not loaded'; return 0; }
        if (!this.limiter.allow(Date.now())) { entry.reason = 'rate'; return 0; }
        try { scene.sound.play(key, { volume }); } catch (e) { entry.reason = 'error'; return 0; }
        entry.played = true;
        return volume;
    }

    /** npc_used:<objectId>: the object's useSound at the NPC. */
    onUsed(data) {
        if (!data?.npcId || !data.objectId) return;
        const obj = win().npcNeedsSystem?.world?.getObject?.(data.objectId);
        const key = obj?.affordance?.useSound;
        if (typeof key !== 'string' || !key) return;
        const b = win().npcBehaviorManager?.getBehavior?.(data.npcId);
        const npc = b?.sprite;
        if (!npc) return;
        const roomId = b.roomId || obj.roomId;
        const v = this.playAt(key, npc.x, npc.y, roomId, { npcId: data.npcId, objectId: data.objectId });
        if (v > 0) {
            win().eventDispatcher?.emit?.(`npc_use_heard:${data.objectId}`,
                { npcId: data.npcId, objectId: data.objectId, key, volume: Math.round(v * 1000) / 1000, hearing: hearingLevel(roomId) });
        }
    }
}

export function installNpcOfficeVisuals(scene) {
    const w = win();
    if (!officeVisualsOn()) return null;
    if (!w.npcOfficeVisuals) w.npcOfficeVisuals = new NpcOfficeVisuals(scene);
    const inst = w.npcOfficeVisuals;
    if (scene && inst.hooked !== scene) {
        inst.scene = scene;
        inst.hooked = scene;
        scene.events?.on?.('postupdate', () => { try { inst.followHeld(); } catch (e) { /* never break a frame */ } });
        w.eventDispatcher?.on?.('npc_used:*', (data) => { try { inst.onUsed(data); } catch (e) { /* ignore */ } });
    }
    return inst;
}
