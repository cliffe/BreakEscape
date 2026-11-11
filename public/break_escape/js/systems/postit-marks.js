/**
 * Postit marks (ACCESS_MODEL_SLICE_9_1_PLAN.md, 5.3): a sticky note picture at the top-left
 * corner of a sign-in PC's monitor when its sign-in screen shows a note, so the player can see
 * from across the room that someone keeps their password on the screen.
 *
 * Which PCs: a sign-in PC (`lockType: "login"`, nothing else, so password locks with authored
 * notes in the campaign missions are untouched) whose room data has `hasPostit` (a writesDown
 * owner; the server sends the flag, never the note's text) or an authored `postitNote` that is
 * shown (`showPostit` not false). `mark(pcId, on)` adds or removes one mid-game (slice 9.2).
 *
 * The picture is `notes_postit1` (9 by 9 px, preloaded in core/game.js), inset from the
 * monitor's top-left corner, clear of the lighting system's indicator dot at the top-right. It
 * sits just above the monitor (depth + POSTIT_DEPTH_OFFSET) and below the dot, follows the
 * sprite's visibility and position each frame, takes no clicks, and goes when the sprite does.
 *
 * `syncRoom(roomId)` is called from core/rooms.js once a room's sprites are made.
 */

export const POSTIT_TEXTURE = 'notes_postit1';
export const POSTIT_SIZE = 9;
export const POSTIT_INSET = 3;
export const POSTIT_DEPTH_OFFSET = 0.005;
export const POSTIT_LABEL = 'a sticky note on the monitor';

const win = () => (typeof window !== 'undefined' ? window : {});

/** Does this object's data ask for a note picture? */
export function wantsPostit(data) {
    if (!data || data.lockType !== 'login') return false;
    if (data.hasPostit === true) return true;
    return typeof data.postitNote === 'string' && data.postitNote.trim() !== '' && data.showPostit !== false;
}

/** The picture's centre for a sprite: inset from its top-left corner, whatever its origin. */
export function postitPosition(sprite) {
    const w = sprite.displayWidth ?? sprite.width ?? 32;
    const h = sprite.displayHeight ?? sprite.height ?? 32;
    const ox = sprite.originX ?? 0.5;
    const oy = sprite.originY ?? 0.5;
    const left = sprite.x - w * ox;
    const top = sprite.y - h * oy;
    return { x: Math.round(left + POSTIT_INSET + POSTIT_SIZE / 2), y: Math.round(top + POSTIT_INSET + POSTIT_SIZE / 2) };
}

export class PostitMarks {
    constructor() {
        /** pcId -> { image, sprite } */
        this.marks = new Map();
        /** pcId -> boolean, from mark(); wins over the data. */
        this.forced = new Map();
        this._scene = null;
    }

    _sprites(roomId) {
        const rooms = win().rooms || {};
        const ids = roomId ? [roomId] : Object.keys(rooms);
        const out = [];
        for (const id of ids) {
            for (const sprite of Object.values(rooms[id]?.objects || {})) {
                if (sprite?.scenarioData?.id) out.push(sprite);
            }
        }
        return out;
    }

    _wanted(sprite) {
        const data = sprite.scenarioData;
        if (data?.lockType !== 'login') return false;
        return this.forced.has(data.id) ? this.forced.get(data.id) : wantsPostit(data);
    }

    _add(sprite) {
        const id = sprite.scenarioData.id;
        const have = this.marks.get(id);
        if (have && have.sprite === sprite && have.image?.active !== false) return have.image;
        if (have) this._remove(id);
        const scene = sprite.scene || this._scene;
        if (!scene?.add?.image) return null;
        const { x, y } = postitPosition(sprite);
        const image = scene.add.image(x, y, POSTIT_TEXTURE);
        image.setOrigin?.(0.5, 0.5);
        image.setDepth?.((sprite.depth ?? 0) + POSTIT_DEPTH_OFFSET);
        image.setVisible?.(sprite.visible !== false);
        image.disableInteractive?.();
        this.marks.set(id, { image, sprite });
        return image;
    }

    _remove(id) {
        const have = this.marks.get(id);
        if (!have) return;
        this.marks.delete(id);
        have.image?.destroy?.();
    }

    /** Silent pass over one room's sign-in PCs (or every loaded room). */
    syncRoom(roomId) {
        for (const sprite of this._sprites(roomId)) {
            if (this._wanted(sprite)) this._add(sprite);
            else this._remove(sprite.scenarioData.id);
        }
    }

    /** Add (on) or remove (off) the picture on a loaded sign-in PC; remembered for later loads. */
    mark(pcId, on) {
        if (!pcId) return false;
        this.forced.set(pcId, !!on);
        const sprite = this._sprites().find(s => s.scenarioData.id === pcId);
        if (!on) { this._remove(pcId); return true; }
        if (!sprite || sprite.scenarioData.lockType !== 'login') return false;
        return !!this._add(sprite);
    }

    /**
     * The proximity label for an object (ui/info-label.js): a PC with a note picture says so, so
     * a player who missed the 9 px mark knows to look at the sign-in screen (9.2 B review R1).
     * The note's text is never in it.
     */
    label(objectId, text) {
        if (!text || !objectId || !this.marks.has(objectId)) return text;
        return `${text} (${POSTIT_LABEL})`;
    }

    /** Each frame: follow the sprite's visibility and position; drop a mark whose sprite went. */
    update() {
        for (const [id, { image, sprite }] of [...this.marks]) {
            if (!sprite || sprite.active === false || !sprite.scene) { this._remove(id); continue; }
            const { x, y } = postitPosition(sprite);
            if (image.x !== x || image.y !== y) image.setPosition?.(x, y);
            const visible = sprite.visible !== false;
            if (image.visible !== visible) image.setVisible?.(visible);
        }
    }

    install(scene) {
        this._scene = scene || null;
        if (scene?.events?.on && this._updatingScene !== scene) {
            if (!this._updating) this._updating = () => this.update();
            this._updatingScene?.events?.off?.('update', this._updating);
            this._updatingScene = scene;
            scene.events.on('update', this._updating);
        }
        this.syncRoom();
        return this;
    }
}

export function installPostitMarks(scene) {
    const w = win();
    if (!w.postitMarks) w.postitMarks = new PostitMarks();
    return w.postitMarks.install(scene);
}

export default PostitMarks;
