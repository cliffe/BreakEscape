/**
 * Screen states: a workstation PC shows a locked screen while its owner is away with the
 * screen locked, and makes a lock and an unlock sound when that changes.
 *
 * The rule, for every workstation with an owner (no scenario fields, no opt-in): the sprite
 * shows `<key>_locked` when the owner has an away record, the screen is locked
 * (window.workstationState.isLocked) and the player holds no password session at that PC
 * (window.pcSessions.get(id).via === 'password'; a claimed session never hides it, because a
 * claim cannot exist on a locked screen). Otherwise it shows its base texture. `<key>` is the
 * sprite's own texture key, whatever the object's type: today only `pc_desktop` has locked art
 * (`pc_desktop_locked`), so a scenario sets `"sprite": "pc_desktop"` on a PC that should show
 * the padlock. Any other base keeps its look and still gets the sounds. An object with its own
 * `spriteVariants` is left alone (the author's swap wins), as is one with no owner.
 *
 * Event driven, never polled:
 *
 *   workstation_owner_left:*, workstation_auto_locked:*, workstation_owner_returned:*
 *                                   -> apply(objectId, { audible: true })
 *                                      (silent for an owner_left with reason 'ko': a
 *                                      knocked-out owner locks nothing by hand)
 *   pc_signed_in, pc_signed_out     -> apply(pcId, { audible: false })
 *   a room's sprites are made       -> syncRoom(roomId), silent (core/rooms.js)
 *
 * A sound plays only on a real change of look, from one of the three workstation events, for a
 * PC in the room the player is in (the last room they were in while they stand in a doorway
 * or a gap between rooms). So nothing flashes or sounds at boot or on a reload: the
 * install pass and every syncRoom are silent, and after a load every owner is at their post.
 *
 * `transitions` keeps the last 50 changes, `{ objectId, locked, sound, at }` (sound is the name
 * played, or null), for the test bridge (window.__test.access.screenTransitions()).
 */

import { isWorkstation, ownerOf } from './workstation-state.js';

export const LOCK_SOUND = 'lockpick_set';
export const UNLOCK_SOUND = 'ui_confirm';
const MAX_TRANSITIONS = 50;

const win = () => (typeof window !== 'undefined' ? window : {});

/** `<baseKey>_locked` when `exists(key)` says that texture is loaded, else null. */
export function lockedKey(baseKey, exists) {
    if (!baseKey || typeof exists !== 'function') return null;
    const key = `${baseKey}_locked`;
    return exists(key) ? key : null;
}

/** The live sprite of an object and its room, `{ sprite, roomId }`, or null. */
export function findSprite(objectId) {
    for (const [roomId, room] of Object.entries(win().rooms || {})) {
        for (const sprite of Object.values(room?.objects || {})) {
            if (sprite?.scenarioData?.id === objectId) return { sprite, roomId };
        }
    }
    return null;
}

export class ScreenStates {
    constructor() {
        this.transitions = [];
        this._listening = null;
    }

    /** Whether this object takes the locked look at all: an owned workstation with no spriteVariants. */
    _eligible(data) {
        const ws = win().workstationState;
        if (!ws || !isWorkstation(data)) return false;
        if (Array.isArray(data.spriteVariants) && data.spriteVariants.length) return false;
        return !!ownerOf(data, ws.env.npcs());
    }

    /**
     * Bring one PC's sprite into line with its state. Returns the recorded transition when the
     * look changed, else null.
     */
    apply(objectId, { audible = false } = {}) {
        const w = win();
        const found = objectId ? findSprite(objectId) : null;
        if (!found || !this._eligible(found.sprite.scenarioData)) return null;
        const { sprite, roomId } = found;
        const locked = !!w.workstationState.isLocked(objectId) && w.pcSessions?.get?.(objectId)?.via !== 'password';
        // An unset look flag is the base look: a leave that keeps the screen open changes nothing
        if (locked === !!sprite._screenLocked) return null;

        if (sprite._screenBaseKey === undefined) sprite._screenBaseKey = sprite.texture?.key ?? null;
        const textures = sprite.scene?.textures || w.game?.textures;
        const lockedTex = lockedKey(sprite._screenBaseKey, (k) => !!textures?.exists?.(k));
        const key = locked ? lockedTex : sprite._screenBaseKey;
        if (key && lockedTex && sprite.texture?.key !== key && typeof sprite.setTexture === 'function') {
            sprite.setTexture(key);
            // The proximity ghost copied the key once when it was made
            if (typeof sprite.proximityGhost?.setTexture === 'function') sprite.proximityGhost.setTexture(key);
        }
        sprite._screenLocked = locked;

        let sound = null;
        // currentPlayerRoom is '' in a doorway or gap (core/rooms.js); the last room still hears it
        if (audible && roomId === (w.currentPlayerRoom || w.lastPlayerRoom)) {
            sound = locked ? LOCK_SOUND : UNLOCK_SOUND;
            w.soundManager?.play?.(sound);
        }
        const transition = { objectId, locked, sound, at: Date.now() };
        this.transitions.push(transition);
        if (this.transitions.length > MAX_TRANSITIONS) this.transitions.splice(0, this.transitions.length - MAX_TRANSITIONS);
        return transition;
    }

    /** Silent pass over one room's workstation sprites (called once its sprites are made). */
    syncRoom(roomId) {
        const room = win().rooms?.[roomId];
        if (!room?.objects || !win().workstationState) return;
        for (const sprite of Object.values(room.objects)) {
            const id = sprite?.scenarioData?.id;
            if (id && isWorkstation(sprite.scenarioData)) this.apply(id, { audible: false });
        }
    }

    /** Listen for the state events, then a silent pass over every loaded room. */
    install() {
        const dispatcher = win().eventDispatcher;
        if (dispatcher && typeof dispatcher.on === 'function' && this._listening !== dispatcher) {
            this._listening = dispatcher;
            const loud = (d) => { if (d?.objectId) this.apply(d.objectId, { audible: true }); };
            const quiet = (d) => { if (d?.pcId) this.apply(d.pcId, { audible: false }); };
            // A knock-out at the desk rolls the screen like any leave (workstation-state.js),
            // but nobody pressed lock: the look follows, the click does not
            dispatcher.on('workstation_owner_left:*', (d) => { if (d?.objectId) this.apply(d.objectId, { audible: d.reason !== 'ko' }); });
            dispatcher.on('workstation_auto_locked:*', loud);
            dispatcher.on('workstation_owner_returned:*', loud);
            dispatcher.on('pc_signed_in', quiet);
            dispatcher.on('pc_signed_out', quiet);
        }
        for (const roomId of Object.keys(win().rooms || {})) this.syncRoom(roomId);
        return this;
    }
}

/** Build and install the live instance. Idempotent. Call after installWorkstationState(). */
export function installScreenStates() {
    const w = win();
    if (w.screenStates) return w.screenStates;
    w.screenStates = new ScreenStates().install();
    return w.screenStates;
}
