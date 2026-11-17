/**
 * PLANT HIDING (docs/achitechture/PLANT_HIDING_PLAN.md, section 5)
 * ================================================================
 *
 * A hideable device (the pocket rogue AP) can be tucked into any plant in the rooms its
 * `hideable` block allows. This module is the client half. The server decides (POST /inventory,
 * action_type hide) and keeps the record; the client only draws and asks.
 *
 * State, both filled from the bootstrap and never written to gameState or sent back:
 *   hideables  itemId -> { rooms, spots, exclude, device, deviceData, overlay, spotAt, confirm }
 *   hidden     itemId -> { item, on, room }   (hiddenDevices, then each accepted hide)
 *
 * A plant is a spot for an item when its room is in `rooms`, its key names a plant (below),
 * and `spots` / `exclude` allow its id. While the player holds an unhidden hideable item every
 * such plant is interactable; the plant that hosts a hidden device stays interactable and one
 * tap opens the device's console. The overlay is a plain sprite stored under the device id in
 * rooms[roomId].objects, so lighting finds it by id and the behind-wall fade takes it through
 * the host's _fadeCompanions.
 *
 * No static imports here. interactions.js and rooms.js reach this through window.plantHiding,
 * as they reach network-links.js; core/game.js (the entry module, imported by main.js only and
 * by no test) imports it statically. The plant lists are kept in step with
 * lib/break_escape/hiding_spots.rb by test/unit/hiding_spots_test.rb.
 */

export const PLANT_PREFIXES = [
    'plant-flat-pot', 'plant-large', 'planter_', 'planter-', 'fig_plant',
    'office-misc-smallplant', 'wilted_plant'
];
export const PLANT_NEVER = ['plant-large-displacement', 'notes_plantlog', 'm10_sign_plant'];

// Small plants are not hiding spots by default: the 12x10 tucked device is as wide as their
// pots (a scenario can opt one in with hidingSpot: true). Kept in step with
// HidingSpots::SMALL_PLANT. A smaller overlay for them is a possible follow-up.
export const SMALL_PLANT = /^(?:plant-flat-pot|office-misc-smallplant|plant-large(?:[1-9]|10)(?!\d))/;

/** Whether a texture key (Tiled image name, or an authored sprite/type) names a default hiding-spot plant. */
export function isPlantKey(key) {
    const k = typeof key === 'string' ? key : '';
    if (!k) return false;
    if (SMALL_PLANT.test(k)) return false;
    if (PLANT_NEVER.some(bad => k.startsWith(bad))) return false;
    return PLANT_PREFIXES.some(p => k.startsWith(p));
}

// Per-family anchors in per cent of the plant's display box (where the overlay's bottom
// centre sits), measured from each family's art in step H3: x is the pot's centre column, y is
// three pixels below the rim so the box sits in the soil in front of the stems. Longest prefix
// wins. The small plants (plant-large1 to 10, plant-flat-pot, office-misc-smallplant) are not
// spots by default (SMALL_PLANT); one opted in with hidingSpot takes overlay.at or the default.
export const PLANT_ANCHORS = {
    'plant-large11-top-ani': { x: 50, y: 83 },
    'plant-large11': { x: 50, y: 82 },
    'plant-large12-top-ani': { x: 53, y: 83 },
    'plant-large12': { x: 56, y: 80 },
    'plant-large13-top-ani': { x: 52, y: 76 },
    'plant-large13': { x: 50, y: 76 },
    'planter-fig1-top-ani': { x: 50, y: 70 },
    'planter_fig1': { x: 52, y: 70 },
    'fig_plant': { x: 50, y: 73 }
};
export const DEFAULT_ANCHOR = { x: 50, y: 60 };

export const MSG_OCCUPIED = 'Something is already hidden in this plant.';
export const MSG_ALREADY_HIDDEN = 'It is already hidden.';
export const MSG_RETRY = 'Could not hide it. Try again.';
export const HIDE_LABEL = 'Hide it';
export const LEAVE_LABEL = 'Leave it';
export const OVERLAY_DEPTH_STEP = 0.005;
/** Console fields kept from a hiddenWith room object (server: CaptureProofs::DEVICE_DATA_FIELDS). */
const DEVICE_DATA_FIELDS = ['id', 'type', 'name', 'observations', 'wifiTwin', 'apScan', 'apPortal', 'apCaptureLog'];

const win = () => (typeof window !== 'undefined' ? window : {});

/** The host's top-left in world pixels, whatever its origin (decor is (0,0), objects are not). */
export function topLeft(host) {
    if (typeof host.getTopLeft === 'function') {
        const p = host.getTopLeft();
        return { x: p.x, y: p.y };
    }
    const w = host.displayWidth ?? host.width ?? 0;
    const h = host.displayHeight ?? host.height ?? 0;
    const ox = host.displayOriginX ?? w * (host.originX ?? 0);
    const oy = host.displayOriginY ?? h * (host.originY ?? 0);
    return { x: host.x - ox, y: host.y - oy };
}

/** The authored key a plant is judged by (never the live texture, which spriteVariants swaps). */
export function authoredKey(host) {
    const d = host?.scenarioData;
    if (host && host.roomId !== undefined && d) return d.sprite ? d.sprite : d.type;
    return host?.name;
}

/** The anchor, in per cent, by the plan's precedence (section 6). */
export function anchorPercent(host, spotId, def, table = PLANT_ANCHORS) {
    const hideAt = host?.roomId !== undefined ? host?.scenarioData?.hideAt : null;
    const valid = a => a && Number.isFinite(a.x) && Number.isFinite(a.y);
    let at = null;
    if (valid(hideAt)) at = hideAt;
    else if (valid(def?.spotAt?.[spotId])) at = def.spotAt[spotId];
    else {
        const key = authoredKey(host) || '';
        const prefix = Object.keys(table).filter(p => key.startsWith(p)).sort((a, b) => b.length - a.length)[0];
        if (prefix) at = table[prefix];
        else if (valid(def?.overlay?.at)) at = def.overlay.at;
        else at = DEFAULT_ANCHOR;
    }
    return { x: host?.flipX ? 100 - at.x : at.x, y: at.y };
}

/** The overlay's bottom-centre in world pixels, whole numbers. */
export function anchorPoint(host, spotId, def, table = PLANT_ANCHORS) {
    const at = anchorPercent(host, spotId, def, table);
    const tl = topLeft(host);
    const w = host.displayWidth ?? host.width ?? 0;
    const h = host.displayHeight ?? host.height ?? 0;
    return { x: tl.x + Math.round(at.x / 100 * w), y: tl.y + Math.round(at.y / 100 * h) };
}

export class PlantHiding {
    constructor() {
        this.hideables = new Map();
        this.hidden = new Map();
        this._busy = false;
        this._heldKey = '';
        this._warned = new Set();
        this._subscribed = null;
        this._roomDevices = new Map();
    }

    /**
     * core/rooms.js saw a hiddenWith object in a room answer: keep its console fields (the
     * bootstrap omits them for a device authored in the hideable's own room). Whitelist as the
     * server's DEVICE_DATA_FIELDS. Called before syncRoom draws the overlay.
     */
    noteHiddenWith(roomId, obj) {
        if (!obj || typeof obj.id !== 'string' || !obj.id) return;
        const data = {};
        for (const k of DEVICE_DATA_FIELDS) if (obj[k] !== undefined) data[k] = obj[k];
        this._roomDevices.set(obj.id, data);
    }

    /** Fill both maps from the scenario response (core/game.js). No request. */
    load(hideables = {}, hiddenDevices = []) {
        this.hideables.clear();
        this.hidden.clear();
        this._heldKey = '';
        this._warned.clear();
        for (const [id, def] of Object.entries(hideables || {})) {
            if (!def || !Array.isArray(def.rooms) || def.rooms.length === 0) continue;
            this.hideables.set(id, {
                rooms: def.rooms,
                spots: Array.isArray(def.spots) ? def.spots : 'plants',
                exclude: Array.isArray(def.exclude) ? def.exclude : [],
                device: def.device || null,
                deviceData: def.deviceData && typeof def.deviceData === 'object' ? def.deviceData : {},
                overlay: def.overlay && typeof def.overlay === 'object' ? def.overlay : {},
                spotAt: def.spotAt && typeof def.spotAt === 'object' ? def.spotAt : {},
                confirm: typeof def.confirm === 'string' ? def.confirm : null
            });
        }
        for (const h of Array.isArray(hiddenDevices) ? hiddenDevices : []) {
            if (h && this.hideables.has(h.item) && typeof h.on === 'string') {
                this.hidden.set(h.item, { item: h.item, on: h.on, room: h.room });
            }
        }
        this._subscribe();
        this._heldKey = this._heldIds().join('|');
    }

    _subscribe() {
        const d = win().eventDispatcher;
        if (!d?.on || this._subscribed === d) return;
        this._subscribed = d;
        d.on('inventory_changed', () => this.onInventoryChanged());
    }

    // ------------------------------------------------------------------ queries

    _heldEntries() {
        return (win().inventory?.items || []).filter(it => {
            const id = it?.scenarioData?.id;
            return id && this.hideables.has(id) && !this.hidden.has(id);
        });
    }

    /** Hideable item ids in the tray and not yet hidden. */
    heldHideable() { return this._heldIds(); }

    _heldIds() {
        return this._heldEntries().map(it => it.scenarioData.id).sort();
    }

    hiddenMap() { return Object.fromEntries(this.hidden); }

    /** The plant a hidden device's overlay stands on (the fallback host when `on` is gone), for the test bridge. */
    spotForDevice(deviceId) {
        for (const [itemId, entry] of this.hidden) {
            if (this.hideables.get(itemId)?.device === deviceId) return entry.hostId ?? entry.on;
        }
        return null;
    }

    _roomOf(sprite) {
        if (sprite.roomId !== undefined && sprite.roomId !== null) return sprite.roomId;
        const rooms = win().rooms || {};
        for (const [roomId, room] of Object.entries(rooms)) {
            if (room?.objects?.[sprite.objectId] === sprite) return roomId;
        }
        return null;
    }

    /** { id, roomId, key } for a sprite that could be a spot, else null. */
    _spotInfo(sprite) {
        if (!sprite || sprite._plantOverlay) return null;
        const d = sprite.scenarioData;
        const isObject = sprite.roomId !== undefined && sprite.roomId !== null;
        if (isObject) {
            if (!d || typeof d.id !== 'string' || !d.id || d.hiddenWith) return null;
            if (d.hidingSpot === false) return null;
            const key = d.sprite ? d.sprite : d.type;
            if (d.hidingSpot !== true && !isPlantKey(key)) return null;
            return { id: d.id, roomId: sprite.roomId };
        }
        if (typeof sprite.objectId !== 'string' || !sprite.objectId || !isPlantKey(sprite.name)) return null;
        return { id: sprite.objectId, roomId: this._roomOf(sprite) };
    }

    /** Hideable item ids (from the static map only) for which this sprite is a spot. */
    spotsFor(sprite) {
        const info = this._spotInfo(sprite);
        if (!info || !info.roomId) return [];
        const out = [];
        for (const [itemId, def] of this.hideables) {
            if (!def.rooms.includes(info.roomId)) continue;
            if (def.exclude.includes(info.id)) continue;
            if (def.spots !== 'plants' && !def.spots.includes(info.id)) continue;
            out.push(itemId);
        }
        return out;
    }

    /** The hidden entry whose host is this sprite, else null. */
    hostedEntry(sprite) {
        const info = this._spotInfo(sprite);
        if (!info) return null;
        for (const entry of this.hidden.values()) {
            if ((entry.hostId ?? entry.on) === info.id) return entry;
        }
        return null;
    }

    /** True when a tap on this sprite is ours: it hosts a device, or takes one we hold. */
    claims(sprite) {
        if (!sprite || this.hideables.size === 0) return false;
        if (this.hostedEntry(sprite)) return true;
        const held = this._heldIds();
        return held.length > 0 && this.spotsFor(sprite).some(id => held.includes(id));
    }

    // ------------------------------------------------------------------ interactable state

    _setInteractable(sprite, want) {
        if (sprite._hpOrig === undefined) sprite._hpOrig = { interactable: sprite.interactable };
        if (want) {
            if (!sprite.scenarioData) {
                sprite.scenarioData = { name: 'plant', type: 'plant', takeable: false, readable: false };
                sprite._hpStub = true;
            }
            sprite.interactable = true;
        } else {
            sprite.interactable = sprite._hpOrig.interactable;
            if (sprite._hpStub) { sprite.scenarioData = undefined; delete sprite._hpStub; }
            delete sprite._hpOrig;
        }
    }

    /** Make the spots in one room interactable (or plain again) for the items held now. */
    applySpots(roomId) {
        const room = win().rooms?.[roomId];
        if (!room?.objects) return;
        const held = this._heldIds();
        for (const sprite of Object.values(room.objects)) {
            if (!sprite || sprite._plantOverlay) continue;
            const eligible = this.spotsFor(sprite);
            const touched = sprite._hpOrig !== undefined;
            if (eligible.length === 0 && !touched) continue;
            const hosts = !!this.hostedEntry(sprite);
            const spotNow = eligible.some(id => held.includes(id));
            sprite._hidingSpot = spotNow;
            if (hosts || spotNow) this._setInteractable(sprite, true);
            else if (touched) this._setInteractable(sprite, false);
        }
    }

    _affectedRooms() {
        const rooms = new Set();
        for (const def of this.hideables.values()) def.rooms.forEach(r => rooms.add(r));
        return [...rooms].filter(r => win().rooms?.[r]);
    }

    /** inventory_changed: re-run the spot part of syncRoom when the held set changed. */
    onInventoryChanged() {
        const key = this._heldIds().join('|');
        if (key === this._heldKey) return false;
        this._heldKey = key;
        this._affectedRooms().forEach(r => this.applySpots(r));
        return true;
    }

    // ------------------------------------------------------------------ room sync and overlay

    /** A room's sprites have been made (core/rooms.js, core/game.js for the start room). */
    syncRoom(roomId) {
        if (this.hideables.size === 0) return;
        for (const entry of this.hidden.values()) {
            if (entry.room === roomId) this.drawOverlay(entry);
        }
        this.applySpots(roomId);
    }

    /** The recorded spot's sprite, if it is still a spot for this item; else null (the caller falls back). */
    _findHost(room, spotId, itemId) {
        if (!room?.objects) return null;
        const ok = s => s && !s._plantOverlay && this.spotsFor(s).includes(itemId);
        const direct = room.objects[spotId];
        if (direct && !direct._plantOverlay) return ok(direct) ? direct : null;
        return Object.values(room.objects).find(s => ok(s) && s.scenarioData?.id === spotId) || null;
    }

    _fallbackHost(room, itemId) {
        const ids = Object.keys(room.objects || {}).sort();
        for (const id of ids) {
            const s = room.objects[id];
            if (s && !s._plantOverlay && this.spotsFor(s).includes(itemId)) return s;
        }
        return null;
    }

    /** Draw the overlay of one hidden device on its host. Returns the sprite or null. */
    drawOverlay(entry) {
        const def = this.hideables.get(entry.item);
        const room = win().rooms?.[entry.room];
        if (!def || !room) return null;
        const deviceId = def.device || `${entry.item}_hidden`;
        const existing = room.objects?.[deviceId];
        if (existing && existing._plantOverlay && existing.active !== false) {
            if (entry.hostId === undefined && existing._fadeOwner) entry.hostId = this._spotInfo(existing._fadeOwner)?.id;
            return existing;
        }

        let host = this._findHost(room, entry.on, entry.item);
        let spotId = entry.on;
        if (!host) {
            const key = `${entry.item}:${entry.on}`;
            if (!this._warned.has(key)) {
                this._warned.add(key);
                console.warn(`[plantHiding] host ${entry.on} not found in ${entry.room}; using the first eligible plant`);
            }
            host = this._fallbackHost(room, entry.item);
            if (!host) return null;
            spotId = this._spotInfo(host)?.id || entry.on;
        }
        // The plant that really hosts it (the fallback when `on` is gone): hostedEntry matches on this,
        // so that plant is tappable. Never sent to the server and never stored.
        entry.hostId = spotId;
        const scene = host.scene;
        const texKey = def.overlay.sprite;
        if (!scene?.add || !texKey) return null;

        const make = () => {
            const again = room.objects?.[deviceId];
            if (again && again._plantOverlay && again.active !== false) return again;
            const p = anchorPoint(host, spotId, def);
            const sp = scene.add.sprite(p.x, p.y, texKey);
            sp.setOrigin?.(0.5, 1);
            sp.setDepth?.((host.depth ?? 0) + OVERLAY_DEPTH_STEP);
            sp.interactable = false;
            sp._plantOverlay = true;
            sp.objectId = deviceId;
            sp.roomId = entry.room;
            sp.scenarioData = { ...(this._roomDevices.get(deviceId) || {}), ...def.deviceData };
            if (host.visible === false) sp.setVisible?.(false);
            room.objects = room.objects || {};
            room.objects[deviceId] = sp;
            (host._fadeCompanions ||= new Set()).add(sp);
            sp._fadeOwner = host;
            return sp;
        };

        if (scene.textures && !scene.textures.exists(texKey) && scene.load) {
            // Art not preloaded: fetch it as network-links does for a jack's planted look
            // One queued load per texture: a second sync before it finishes only waits for it
            const pending = (this._texPending ||= new Set());
            const first = !pending.has(texKey);
            pending.add(texKey);
            if (first) scene.load.image(texKey, `objects/${texKey}.png`);
            scene.load.once('complete', () => { pending.delete(texKey); make(); });
            if (first) scene.load.start();
            return null;
        }
        return make();
    }

    // ------------------------------------------------------------------ the tap

    _toast(message, type = 'info', ms = 3500) {
        win().gameAlert?.(message, type, '', ms, { plainText: true });
    }

    _emit(name, data, itemId) {
        const d = win().eventDispatcher;
        d?.emit?.(name, data);
        if (itemId) d?.emit?.(`${name}:${itemId}`, data);
    }

    _gameId() { return win().breakEscapeConfig?.gameId || null; }

    /** POST the hide, with one retry on a network error or a 5xx. { status, body } or { error }. */
    async _post(itemId, spotId) {
        const gid = this._gameId();
        if (!gid || typeof fetch !== 'function') return { error: true };
        const payload = { action_type: 'hide', item: { id: itemId }, hidden_in: spotId };
        const csrf = win().document?.querySelector?.('meta[name="csrf-token"]')?.content || '';
        let last = { error: true };
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const resp = await fetch(`/break_escape/games/${gid}/inventory`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': csrf },
                    body: JSON.stringify(payload)
                });
                let body = null;
                try { body = await resp.json(); } catch (e) { body = null; }
                last = { status: resp.status, body };
                if (resp.status >= 500 && attempt === 1) continue;
                return last;
            } catch (err) {
                last = { error: true };
                if (attempt === 2) return last;
            }
        }
        return last;
    }

    _openConsole(overlay) {
        const open = win().openWifiTwin;
        if (typeof open === 'function') open(overlay);
        return { action: 'opened' };
    }

    /**
     * A tap on a claimed plant. Resolves to { action, reason? } for tests: opened | cancelled |
     * hidden | refused | error | busy | none.
     */
    async interact(sprite) {
        const info = this._spotInfo(sprite);
        if (!info) return { action: 'none' };
        const entry = this.hostedEntry(sprite);
        const held = this._heldEntries().filter(it => this.spotsFor(sprite).includes(it.scenarioData.id));

        if (entry) {
            const def = this.hideables.get(entry.item);
            const overlay = def && win().rooms?.[entry.room]?.objects?.[def.device];
            if (overlay?._plantOverlay && overlay.scenarioData?.wifiTwin === true) return this._openConsole(overlay);
            if (held.length === 0) return { action: 'none' };
            this._toast(MSG_OCCUPIED);
            return { action: 'refused', reason: 'occupied' };
        }
        if (held.length === 0) return { action: 'none' };
        if (this._busy) return { action: 'busy' };

        const item = held[0];
        const itemId = item.scenarioData.id;
        const def = this.hideables.get(itemId);
        const text = def.confirm || `Hide the ${item.scenarioData.name || 'device'} in this plant?`;
        const confirmFn = win().gameConfirm;
        const ok = typeof confirmFn === 'function' ? await confirmFn(text, HIDE_LABEL, LEAVE_LABEL, { plainText: true }) : false;
        if (!ok) return { action: 'cancelled' };

        this._busy = true;
        try {
            return await this._hide(item, itemId, info);
        } finally {
            this._busy = false;
        }
    }

    async _hide(item, itemId, info) {
        const res = await this._post(itemId, info.id);
        if (res.error || res.status >= 500 || !res.body) {
            this._toast(MSG_RETRY, 'error');
            return { action: 'error' };
        }
        const body = res.body;
        const hidden = body.hidden && typeof body.hidden === 'object' ? body.hidden : null;
        const reason = body.reason || null;

        if (res.status >= 200 && res.status < 300 && body.success && hidden) {
            this._finish(item, itemId, hidden);
            this._runOnHidden(item, info.id);
            this._emit('device_hidden', {
                itemId, spotId: hidden.on, roomId: hidden.room, deviceId: this.hideables.get(itemId)?.device || null
            }, itemId);
            return { action: 'hidden', spotId: hidden.on };
        }
        if (reason === 'already_hidden' && hidden) {
            this._finish(item, itemId, hidden);
            this._toast(MSG_ALREADY_HIDDEN);
            return { action: 'refused', reason: 'already_hidden' };
        }
        this._toast(body.message || MSG_RETRY, 'info', 4000);
        return { action: 'refused', reason };
    }

    /** The tray item goes (the server already removed it), the entry is stored, the overlay drawn. */
    _finish(item, itemId, hidden) {
        this.hidden.set(itemId, { item: itemId, on: hidden.on, room: hidden.room });
        try { win().removeFromInventory?.(item); } catch (e) { console.warn('[plantHiding] tray removal failed:', e); }
        this.drawOverlay(this.hidden.get(itemId));
        this._heldKey = this._heldIds().join('|');
        this._affectedRooms().forEach(r => this.applySpots(r));
    }

    _runOnHidden(item, spotId) {
        const list = item?.scenarioData?.hideable?.onHidden;
        if (Array.isArray(list) && list.length) {
            win().applyActions?.(list, { source: 'object_interact', objectId: spotId });
        }
    }
}

export const plantHiding = new PlantHiding();
if (typeof window !== 'undefined') window.plantHiding = plantHiding;
