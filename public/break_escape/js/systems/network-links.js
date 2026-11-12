/**
 * NETWORK LINKS (slice 9.3a, docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md 4.1 and 4.3)
 * ==========================================================================================
 *
 * The only place the client asks about networks, as pc-sessions.js is for sign-in
 * sessions. It keeps:
 *
 *   footholds  footholdId -> { id, via, name, itemId, sourceId, network: { id, name } },
 *              the footholds the server holds now, filled from the scenario response on
 *              load and from each plant and unplug answer;
 *   gained     every jack a foothold was ever gained from (the server's gainedFootholds,
 *              read by unlock_object tasks on a jack);
 *   views      footholdId -> the last GET /network entry fetched for it;
 *   trip       the way back from the network screens (4.3, "Getting back"), below.
 *
 * The jack. A click on an object with `networkJack: true` runs interactJack(sprite)
 * (interactions.js): a planted jack asks "Unplug it" / "Leave it"; with no rogue device
 * held it shows the jack's requiresItemHint; otherwise it confirms with `jackConfirm` and
 * only then asks the server (POST /network/plant). The device leaves the tray and the link
 * item arrives through inventory.js's showServerItem and syncInventoryFromServer, with no
 * inventory request; the jack shows its `plantedSprite`; `<jackId>_planted` is published;
 * the view opens by itself the first time a foothold is gained at that jack.
 *
 * Events, each also as `<name>:<id>`:
 *   network_foothold_gained   (jack/pc/ap id) { footholdId, via, networkId, sourceId }
 *                                           via is 'jack', 'implant' (9.3b I) or 'wifi' (9.3b W)
 *   network_joined            (ap id)       { apId, footholdId, networkId }   (slice 9.3b W)
 *   network_device_planted    (jack id)     { jackId, footholdId, networkId, deviceId }
 *   network_device_refused    (jack id)     { jackId, reason }       reason: no_device | port_security
 *   network_device_unplugged  (jack id)     { jackId, footholdId, endedPcIds }
 *   network_view_closed       (foothold id) { footholdId, reason }   reason: closed |
 *                                           link_dropped | foothold_gone
 *
 * The trip (4.3). open(footholdId, { returnTo }) and openSession(pcId, { returnTo }) start
 * one; every network screen reports why it closed through landed(screen, reason, detail),
 * which looks the pair up in the landing table and calls resume(message) (reopen the view)
 * or leave(reason) (back to the world: network_view_closed, then returnTo({ reason }) when
 * no minigame is open). No network screen hands returnTo to MinigameFramework.
 *
 * The screens themselves are step 8's. They are looked up on window when called, so step
 * 8 adds them with no edit here:
 *   window.startNetworkViewMinigame(footholdId, { message })   the network view
 *   window.openRemoteDesktop(pcId, footholdId)                 a held remote session's desktop
 * Until they exist, open and openSession show a one-line toast naming the network and end
 * the trip at once (leave("closed")), so a returnTo still runs.
 *
 * Exposed as window.networkLinks; window.__test.access.footholds() reads list() and
 * networkView(id) reads lastView(id).
 */

import { resolveObjectField } from '../utils/conditional-text.js';
import { writeGlobal } from './global-writer.js';

export const NO_DEVICE_HINT = 'You have nothing to plug into this port.';
export const LINK_GONE_MESSAGE = 'The link is gone.';
export const PLANT_LABEL = 'Plug it in';
export const UNPLUG_LABEL = 'Unplug it';
export const LEAVE_LABEL = 'Leave it';
export const sessionEndedMessage = (host) => `Your session on ${host || 'that host'} has ended.`;
export const unreachableMessage = (host) => `${host || 'That host'} can't be reached over this link.`;

const win = () => (typeof window !== 'undefined' ? window : {});
const apiClient = () => win().ApiClient || win().APIClient || null;
const nextTick = () => new Promise(resolve => setTimeout(resolve, 0));
const minigameOpen = () => !!win().MinigameFramework?.currentMinigame;
const linkItemId = (footholdId) => `netlink_${footholdId}`;
const footholdIdFor = (jackId) => `jack_${jackId}`;
const plantedGlobal = (jackId) => `${jackId}_planted`;

function toast(message, type = 'info', ms = 3000) {
    // Every toast here carries author or server text (jack hints, port-security refusals,
    // network names), so it goes out as plain text: a `<` or markup renders literally
    // (review R1 minor 1). The confirm dialogs on the same jack already pass plainText.
    try { win().gameAlert?.(message, type, '', ms, { plainText: true }); } catch (e) { /* no notification layer */ }
}

function cleanFoothold(f) {
    if (!f || typeof f !== 'object' || typeof f.id !== 'string' || !f.id) return null;
    const network = f.network && typeof f.network === 'object'
        ? { id: f.network.id ?? null, name: f.network.name ?? null } : { id: null, name: null };
    const out = {
        id: f.id,
        via: f.via ?? 'jack',
        name: f.name ?? null,
        itemId: f.itemId || linkItemId(f.id),
        sourceId: f.sourceId ?? null,
        network
    };
    // The bootstrap also carries the link item's look (none is secret), so restoreHandles
    // rebuilds the real item (review R1 minor 2)
    for (const key of ['sprite', 'observations', 'storeIn']) {
        if (typeof f[key] === 'string' && f[key]) out[key] = f[key];
    }
    return out;
}

// The landing table of 4.3: screen -> reason -> what happens. `resume` reopens the view
// (optionally with a message), `leave` ends the trip, null means another screen has
// taken over and nothing happens here.
const LANDINGS = {
    view: {
        close: () => ({ leave: 'closed' }),
        handover: () => null,
        foothold_gone: () => ({ leave: 'foothold_gone', message: LINK_GONE_MESSAGE })
    },
    signin: {
        // Closed with no session at that PC: the view. With one (Switch user left with no
        // new sign-in): the desktop of the session still held.
        close: (self, d) => (self._sessionAt(d.pcId) ? { desktop: d.pcId } : { resume: true }),
        handover: () => null
    },
    desktop: {
        close: (self) => (self.trip?.start === 'session' ? { leave: 'closed' } : { resume: true }),
        handover: () => null,
        switch: () => null,
        item: () => null,
        share: () => null,
        sign_out: () => ({ resume: true }),
        no_session: (self, d) => ({ resume: true, message: sessionEndedMessage(self._hostOf(d)) }),
        unreachable: (self, d) => ({ resume: true, message: unreachableMessage(self._hostOf(d)) }),
        displaced: () => ({ resume: true }),
        link_dropped: () => ({ leave: 'link_dropped' })
    },
    share: {
        close: () => ({ resume: true }),
        handover: () => null,
        item: () => null
    }
};

export class NetworkLinks {
    constructor() {
        this.footholds = new Map();
        this.gained = new Set();
        this.views = new Map();
        this.deviceNames = new Map();
        this.trip = null;
        this._tripSeq = 0;
        this._busy = false;
    }

    _emit(name, data, id) {
        const dispatcher = win().eventDispatcher;
        if (!dispatcher || typeof dispatcher.emit !== 'function') return;
        try {
            dispatcher.emit(name, data);
            if (id) dispatcher.emit(`${name}:${id}`, data);
        } catch (e) {
            console.warn(`[network-links] ${name} listeners threw`, e);
        }
    }

    // ------------------------------------------------------------------ state

    /**
     * The scenario response's `footholds` and `gainedFootholds`, after a load or reload.
     * Publishes `<jackId>_planted` for every jack a foothold was ever gained from (true while
     * held), straight into the globals, before any room loads. No request.
     */
    load(footholds = [], gainedFootholds = []) {
        this.footholds.clear();
        this.gained.clear();
        this.views.clear();
        this.trip = null;
        (Array.isArray(gainedFootholds) ? gainedFootholds : []).forEach(id => {
            if (typeof id === 'string' && id) this.gained.add(id);
        });
        (Array.isArray(footholds) ? footholds : []).forEach(f => {
            const clean = cleanFoothold(f);
            if (!clean) return;
            this.footholds.set(clean.id, clean);
            if (clean.sourceId) this.gained.add(clean.sourceId);
        });
        const globals = win().gameState?.globalVariables;
        if (globals) {
            for (const jackId of this.gained) globals[plantedGlobal(jackId)] = this.heldAt(jackId) !== null;
        }
    }

    /**
     * After the saved inventory is restored: a held foothold whose link item is missing
     * from the tray gets it back (a client that lost only its handle, 4.1), with the sprite,
     * observations and storeIn the bootstrap foothold carries. No request.
     */
    restoreHandles() {
        const show = win().showServerItem;
        if (typeof show !== 'function') return 0;
        let shown = 0;
        for (const f of this.footholds.values()) {
            if (this._trayItem(f.itemId)) continue;
            const item = {
                id: f.itemId, type: 'network_link', name: f.name || 'Network link',
                takeable: false, footholdId: f.id, sourceId: f.sourceId,
                observations: f.observations || 'Open it to see what it reaches.'
            };
            if (f.sprite) item.sprite = f.sprite;
            if (f.storeIn) item.storeIn = f.storeIn;
            if (show(item, { restored: true })) shown++;
        }
        return shown;
    }

    /** Every held foothold, in the order the server gave them. */
    list() { return [...this.footholds.values()].map(f => ({ ...f, network: { ...f.network } })); }

    get(footholdId) {
        const f = this.footholds.get(footholdId);
        return f ? { ...f, network: { ...f.network } } : null;
    }

    /** The foothold held at this jack, or null. */
    heldAt(jackId) {
        for (const f of this.footholds.values()) if (f.sourceId === jackId) return f;
        return null;
    }

    /** True once a foothold has ever been gained at this jack (an unlock_object task on it). */
    wasGained(jackId) { return this.gained.has(jackId); }

    gainedFootholds() { return [...this.gained]; }

    /** The last GET /network entry fetched for this foothold, or null. */
    lastView(footholdId) { return this.views.get(footholdId) ?? null; }

    /**
     * GET /network for one foothold. Resolves
     *   { ok: true, view }                 the entry { id, via, name, network, hosts }
     *   { ok: false, reason: 'gone' }      the server holds no such foothold (404): the
     *                                      local copy is dropped
     *   { ok: false, reason: 'error' }     no answer
     */
    async view(footholdId) {
        const api = apiClient();
        if (!api?.network) return { ok: false, reason: 'error' };
        let body;
        try {
            body = await api.network(footholdId);
        } catch (err) {
            if (err?.status === 404) {
                this._dropFoothold(footholdId);
                return { ok: false, reason: 'gone' };
            }
            return { ok: false, reason: 'error' };
        }
        const entry = (Array.isArray(body?.footholds) ? body.footholds : []).find(f => f?.id === footholdId);
        if (!entry) {
            this._dropFoothold(footholdId);
            return { ok: false, reason: 'gone' };
        }
        this.views.set(footholdId, entry);
        const clean = cleanFoothold(entry);
        if (clean) this.footholds.set(clean.id, { ...(this.footholds.get(clean.id) || {}), ...clean });
        return { ok: true, view: entry };
    }

    _dropFoothold(footholdId) {
        const f = this.footholds.get(footholdId);
        if (!f) return;
        this.footholds.delete(footholdId);
        this.views.delete(footholdId);
        // The server holds no such foothold, so it holds no link item for it either
        win().syncInventoryFromServer?.([], [f.itemId]);
        if (f.sourceId) {
            this._publishPlanted(f.sourceId, false);
            this._applyJackLookById(f.sourceId);
        }
    }

    _trayItem(id) {
        if (!id) return null;
        return (win().inventory?.items || []).find(it => it?.scenarioData?.id === id) || null;
    }

    _publishPlanted(jackId, value) {
        // Display state only: the server never reads it (3.5)
        writeGlobal(plantedGlobal(jackId), value);
    }

    // ------------------------------------------------------------------ the jack's look

    _jackSprites(jackId = null) {
        const out = [];
        for (const room of Object.values(win().rooms || {})) {
            for (const sprite of Object.values(room?.objects || {})) {
                const data = sprite?.scenarioData;
                if (data?.networkJack === true && (!jackId || data.id === jackId)) out.push(sprite);
            }
        }
        return out;
    }

    /** The planted look while a device is in the jack (plantedSprite), else the base look. */
    applyJackLook(sprite) {
        const data = sprite?.scenarioData;
        if (!data?.networkJack) return;
        const planted = this.heldAt(data.id) !== null;
        data.jackPlanted = planted;
        if (sprite._jackBaseKey === undefined) sprite._jackBaseKey = sprite.texture?.key ?? null;
        const key = planted && data.plantedSprite ? data.plantedSprite : sprite._jackBaseKey;
        if (!key || sprite.texture?.key === key || typeof sprite.setTexture !== 'function') return;
        const set = () => {
            sprite.setTexture(key);
            if (typeof sprite.proximityGhost?.setTexture === 'function') sprite.proximityGhost.setTexture(key);
        };
        const scene = sprite.scene;
        if (scene?.textures && !scene.textures.exists(key) && scene.load) {
            scene.load.image(key, `objects/${key}.png`);
            scene.load.once('complete', set);
            scene.load.start();
        } else {
            set();
        }
    }

    _applyJackLookById(jackId) {
        this._jackSprites(jackId).forEach(sprite => this.applyJackLook(sprite));
    }

    /** A room's sprites have been made (core/rooms.js): every jack there takes its look. */
    syncRoom(roomId) {
        const room = win().rooms?.[roomId];
        for (const sprite of Object.values(room?.objects || {})) {
            if (sprite?.scenarioData?.networkJack === true) this.applyJackLook(sprite);
        }
    }

    // ------------------------------------------------------------------ plant and unplug

    _heldDevice() {
        return (win().inventory?.items || []).find(it => it?.scenarioData?.rogueDevice === true && it.scenarioData.id) || null;
    }

    _deviceName(foothold) {
        if (!foothold) return 'device';
        const known = this.deviceNames.get(foothold.id);
        if (known) return known;
        // The server writes the link item's observations as "Your <device> on <jack>. ..." (4.1)
        const obs = this._trayItem(foothold.itemId)?.scenarioData?.observations;
        const m = typeof obs === 'string' ? obs.match(/^Your (.+?) on /) : null;
        return m ? m[1] : 'device';
    }

    /** A click on a jack (interactions.js). Resolves to what happened, for tests. */
    async interactJack(sprite) {
        const data = sprite?.scenarioData;
        const jackId = data?.id;
        if (!jackId || !data.networkJack) return { action: 'none' };
        if (this._busy) return { action: 'busy' };
        const confirm = win().gameConfirm;
        const held = this.heldAt(jackId);

        if (held) {
            const message = `Your ${this._deviceName(held)} is plugged in here. Open it from your inventory.`;
            const unplug = typeof confirm === 'function'
                ? await confirm(message, UNPLUG_LABEL, LEAVE_LABEL, { plainText: true }) : false;
            if (!unplug) return { action: 'left' };
            return this.unplug(jackId, sprite);
        }

        const device = this._heldDevice();
        if (!device) {
            const hint = resolveObjectField(data, 'requiresItemHint', NO_DEVICE_HINT) || NO_DEVICE_HINT;
            toast(hint, 'info', 3500);
            this._emit('network_device_refused', { jackId, reason: 'no_device' }, jackId);
            return { action: 'refused', reason: 'no_device' };
        }

        const deviceName = device.scenarioData.name || 'the device';
        const jackName = data.name || 'this port';
        const text = resolveObjectField(data, 'jackConfirm', `Plug ${deviceName} into ${jackName}?`)
            || `Plug ${deviceName} into ${jackName}?`;
        const ok = typeof confirm === 'function' ? await confirm(text, PLANT_LABEL, 'Cancel', { plainText: true }) : false;
        if (!ok) return { action: 'cancelled' };
        return this.plant(jackId, device.scenarioData.id, { deviceName: device.scenarioData.name });
    }

    /** POST /network/plant, then the tray, the jack, the global and the events. */
    async plant(jackId, deviceId = null, { deviceName = null } = {}) {
        const api = apiClient();
        if (!api?.networkPlant) return { action: 'error' };
        this._busy = true;
        let body;
        try {
            body = await api.networkPlant(jackId, deviceId);
        } catch (err) {
            const b = err?.body || {};
            if (err?.status === 422 && b.reason === 'no_device') {
                toast(NO_DEVICE_HINT, 'info', 3500);
                this._emit('network_device_refused', { jackId, reason: 'no_device' }, jackId);
                return { action: 'refused', reason: 'no_device' };
            }
            if (err?.status === 422 && b.reason === 'port_security') {
                // Port security (section 5.4): the switch refused the device, which stays in
                // the inventory. Show the authored message so the fix is not lost.
                toast(b.error || 'That port only takes known machines.', 'info', 5000);
                this._emit('network_device_refused', { jackId, reason: 'port_security' }, jackId);
                return { action: 'refused', reason: 'port_security' };
            }
            toast(err?.status === 403 ? "You can't reach that port from here." : 'The port did not respond. Try again.', 'error');
            return { action: 'error', status: err?.status ?? null };
        } finally {
            this._busy = false;
        }
        const foothold = cleanFoothold(body?.foothold);
        if (!body?.success || !foothold) return { action: 'error' };

        const ids = [foothold.itemId];
        if (deviceId) ids.push(deviceId);
        win().syncInventoryFromServer?.(body.inventory, ids);
        this.footholds.set(foothold.id, foothold);
        this.gained.add(jackId);
        if (deviceName) this.deviceNames.set(foothold.id, deviceName);
        this._applyJackLookById(jackId);
        this._publishPlanted(jackId, true);
        if (body.already) return { action: 'already', footholdId: foothold.id };

        const networkId = foothold.network?.id ?? null;
        this._emit('network_device_planted', { jackId, footholdId: foothold.id, networkId, deviceId: deviceId ?? null }, jackId);
        this._emit('network_foothold_gained', { footholdId: foothold.id, via: foothold.via, networkId, sourceId: jackId }, jackId);
        // Seeing what is exposed is the point: the first foothold at a jack opens the view
        if (body.first) this.open(foothold.id);
        return { action: 'planted', footholdId: foothold.id, first: !!body.first };
    }

    /**
     * POST /network/implant (slice 9.3b I): a device in a PC, not a jack, grants a foothold.
     * Fired from apply-actions.js when a grant_foothold action runs. `shape` is 'dropped'
     * (an NPC uses a dropped device) or 'session' (a BadUSB the player holds). One retry on a
     * network error, because a timer is saved fired and never re-runs, so a single lost
     * request would lose the foothold for good. Resolves to what happened, for tests.
     */
    async implant(pcId, shape, path = null) {
        const api = apiClient();
        if (!api?.networkImplant || !pcId || !shape) return { action: 'error' };
        let body = null;
        for (let attempt = 0; attempt < 2 && !body; attempt++) {
            try {
                body = await api.networkImplant(pcId, shape, path);
            } catch (err) {
                const b = err?.body || {};
                if (err?.status === 422 && b.reason === 'usb_refused') {
                    toast(b.error || 'That device was refused.', 'info', 4000);
                    this._emit('network_device_refused', { pcId, reason: 'usb_refused' }, pcId);
                    return { action: 'refused', reason: 'usb_refused' };
                }
                // not_ready / no_action are quiet: the beat that fired this was wrong about
                // the state. A network error retries once, then gives up quietly.
                if (err?.status === 422 || err?.status === 404) {
                    return { action: 'not_ready', reason: b.reason || null };
                }
                if (attempt === 1) {
                    // Both tries lost to a transient network error: the timer that fired this
                    // beat is saved fired and never re-runs, so the foothold is gone for good.
                    // Say so in plain text rather than fail silently (review R1 nit 2).
                    toast('The device could not reach the network. The foothold was lost.', 'error', 4000);
                    return { action: 'error', status: err?.status ?? null };
                }
            }
        }
        const foothold = cleanFoothold(body?.foothold);
        if (!body?.success || !foothold) return { action: 'error' };

        // Reconcile only the ids the server says changed, as plant() does (review R1 client M1):
        // the link item added, and the one device the session shape consumed (consumedId). The
        // dropped shape consumes nothing. Never pass the whole tray: an item whose own pickup
        // persist is still in flight would be absent from the server snapshot and wrongly removed.
        const ids = [foothold.itemId];
        if (body.consumedId) ids.push(body.consumedId);
        win().syncInventoryFromServer?.(body.inventory, ids);
        this.footholds.set(foothold.id, foothold);
        if (foothold.sourceId) this.gained.add(foothold.sourceId);
        this._publishPlanted(pcId, true);
        if (body.already) return { action: 'already', footholdId: foothold.id };

        const networkId = foothold.network?.id ?? null;
        this._emit('network_foothold_gained', { footholdId: foothold.id, via: foothold.via, networkId, sourceId: pcId }, pcId);
        if (body.first) this.open(foothold.id);
        return { action: 'implanted', footholdId: foothold.id, first: !!body.first };
    }

    /** POST /network/unplug: the device back, the link item and the foothold gone. */
    async unplug(jackId, sprite = null) {
        const api = apiClient();
        if (!api?.networkUnplug) return { action: 'error' };
        const footholdId = footholdIdFor(jackId);
        const foothold = this.footholds.get(footholdId) || this.heldAt(jackId);
        this._busy = true;
        let body;
        try {
            body = await api.networkUnplug(jackId);
        } catch (err) {
            const b = err?.body || {};
            if (err?.status === 422 && b.reason === 'not_planted') {
                // The server holds nothing here: the client's copy was stale
                this._dropFoothold(foothold?.id || footholdId);
                toast('Nothing is plugged in here.', 'info');
                return { action: 'not_planted' };
            }
            toast(err?.status === 403 ? "You can't reach that port from here." : 'The port did not respond. Try again.', 'error');
            return { action: 'error', status: err?.status ?? null };
        } finally {
            this._busy = false;
        }
        if (!body?.success) return { action: 'error' };
        const id = foothold?.id || footholdId;
        const inventory = Array.isArray(body.inventory) ? body.inventory : [];
        // The link item leaves; the device that came back (a rogue device the tray lacks) arrives
        const ids = [foothold?.itemId || linkItemId(id),
            ...inventory.filter(it => it?.rogueDevice === true && it.id).map(it => it.id)];
        win().syncInventoryFromServer?.(inventory, ids);
        this.footholds.delete(id);
        this.views.delete(id);
        this.deviceNames.delete(id);
        this._applyJackLookById(jackId);
        if (sprite) this.applyJackLook(sprite);
        this._publishPlanted(jackId, false);
        const endedPcIds = Array.isArray(body.endedPcIds) ? body.endedPcIds : [];
        this._emit('network_device_unplugged', { jackId, footholdId: id, endedPcIds }, jackId);
        return { action: 'unplugged', footholdId: id, endedPcIds };
    }

    // ------------------------------------------------------------------ Wi-Fi (slice 9.3b W, 5.3)

    /**
     * A click on a Wi-Fi access point (interactions.js). Tries an open join first (no key);
     * a keyed network answers wrong_key, so the key minigame opens. Resolves to what
     * happened, for tests.
     */
    async interactWifiAp(sprite) {
        const data = sprite?.scenarioData;
        const apId = data?.id;
        if (!apId || data.wifiAp !== true) return { action: 'none' };
        if (this._busy) return { action: 'busy' };
        // A key minigame already open (e.g. a rapid second click) must not stack a second one
        const mg = win().MinigameFramework;
        if (mg?.currentMinigame && !mg.currentMinigame._ending) return { action: 'busy' };
        const probe = await this.join(apId, null);
        if (probe.action === 'wrong_key') return this._promptWifiKey(apId, data);
        return probe;
    }

    /**
     * POST /network/join, then the tray, the foothold and the events. `key` null is an open
     * join (or the probe before the key prompt). A wrong key resolves { action: 'wrong_key' }
     * with no toast, so the caller can open the key minigame.
     */
    async join(apId, key = null) {
        const api = apiClient();
        if (!api?.networkJoin) return { action: 'error' };
        this._busy = true;
        let body;
        try {
            body = await api.networkJoin(apId, key);
        } catch (err) {
            const b = err?.body || {};
            if (err?.status === 422 && b.reason === 'wrong_key') return { action: 'wrong_key' };
            toast(err?.status === 403 ? "You can't reach that access point from here." : 'The access point did not respond. Try again.', 'error');
            return { action: 'error', status: err?.status ?? null };
        } finally {
            this._busy = false;
        }
        const foothold = cleanFoothold(body?.foothold);
        if (!body?.success || !foothold) return { action: 'error' };
        win().syncInventoryFromServer?.(body.inventory, [foothold.itemId]);
        this.footholds.set(foothold.id, foothold);
        this.gained.add(apId);
        const networkId = foothold.network?.id ?? null;
        // Events are client-emitted from the answer (as the plant does); network_joined fires
        // for a second access point too, so a task or mapping on either one completes (5.3)
        this._emit('network_joined', { apId, footholdId: foothold.id, networkId, already: !!body.already }, apId);
        if (body.already) return { action: 'already', footholdId: foothold.id };
        this._emit('network_foothold_gained', { footholdId: foothold.id, via: foothold.via, networkId, sourceId: apId }, apId);
        // Seeing what is exposed is the point: the first join opens the view
        if (body.first) this.open(foothold.id);
        return { action: 'joined', footholdId: foothold.id, first: !!body.first };
    }

    /** Open the key minigame for a keyed access point (password minigame, join mode). */
    _promptWifiKey(apId, data) {
        const framework = win().MinigameFramework;
        if (!framework?.startMinigame) {
            toast('This network needs a key.', 'info');
            return { action: 'needs_key' };
        }
        if (!framework.mainGameScene && win().game) framework.init(win().game);
        framework.startMinigame('password', null, {
            // The join branch builds and escapes its own visible header from join.apName
            // (password-minigame.js). Feed the base template a constant title, never the
            // author access-point name, so author text never reaches the unescaped
            // params.title HTML sink in base-minigame.js.
            title: 'Join Wi-Fi',
            lockable: null,
            requiresKeyboardInput: true,
            join: { apId, apName: data?.name || 'this network' }
        });
        return { action: 'prompt' };
    }

    // ------------------------------------------------------------------ the trip (4.3)

    _startTrip(trip) {
        this.trip = { ...trip, seq: ++this._tripSeq };
        return this.trip;
    }

    _sessionAt(pcId) {
        // A claimed session is a physical thing and never served over the network (4.3)
        const s = pcId ? win().pcSessions?.get?.(pcId) : null;
        return !!(s && s.via !== 'claim');
    }

    _hostOf(detail = {}) {
        if (detail.host) return detail.host;
        const s = detail.pcId ? win().pcSessions?.get?.(detail.pcId) : null;
        if (s?.host) return s.host;
        for (const v of this.views.values()) {
            const row = (v?.hosts || []).find(h => h?.id === detail.pcId);
            if (row?.host) return row.host;
        }
        return detail.pcId || null;
    }

    /**
     * Open the network view for a held foothold, starting a trip. `returnTo({ reason })` is
     * called once when the player leaves the network screens (4.3, 13.4).
     */
    open(footholdId, { returnTo = null } = {}) {
        const trip = this._startTrip({ footholdId, start: 'view', pcId: null,
            returnTo: typeof returnTo === 'function' ? returnTo : null });
        if (!this.footholds.has(footholdId)) {
            toast(LINK_GONE_MESSAGE, 'info');
            this.leave('foothold_gone');
            return trip;
        }
        this._showView(trip, null);
        return trip;
    }

    /**
     * Open a held remote session's desktop through its foothold, starting a trip (offered to
     * the capture log, 13.4). The session's foothold comes from pcSessions (step 8 adds it).
     */
    openSession(pcId, { returnTo = null } = {}) {
        const session = win().pcSessions?.get?.(pcId) || null;
        const footholdId = session?.footholdId ?? null;
        const trip = this._startTrip({ footholdId, start: 'session', pcId,
            returnTo: typeof returnTo === 'function' ? returnTo : null });
        const startDesktop = win().openRemoteDesktop;
        if (typeof startDesktop === 'function' && footholdId) {
            startDesktop(pcId, footholdId);
            return trip;
        }
        const f = footholdId ? this.footholds.get(footholdId) : null;
        toast(f?.network?.name ? `Remote session on ${this._hostOf({ pcId })}, through ${f.network.name}`
            : `Remote session on ${this._hostOf({ pcId })}`, 'info');
        this.leave('closed');
        return trip;
    }

    _showView(trip, message) {
        const start = win().startNetworkViewMinigame;
        if (typeof start === 'function') {
            start(trip.footholdId, { message: message || null });
            return;
        }
        // Until step 8's view exists: fetch it (so a run can read it), say which network
        // this link is on, and end the trip at once.
        const f = this.footholds.get(trip.footholdId);
        const line = f?.network?.name ? `${f.name || 'Your link'}, on ${f.network.name}` : (f?.name || 'Your link');
        toast(message ? `${message} ${line}` : line, 'info', 4000);
        this.view(trip.footholdId).catch(() => {});
        this.leave('closed');
    }

    /**
     * Reopen the trip's view (with an optional one-line message), one tick later, unless a
     * minigame has opened meanwhile or no trip is running.
     */
    async resume(message = null) {
        const trip = this.trip;
        await nextTick();
        if (!trip || this.trip !== trip) return false;
        if (minigameOpen()) return false;
        if (!trip.footholdId || !this.footholds.has(trip.footholdId)) {
            toast(LINK_GONE_MESSAGE, 'info');
            this.leave('foothold_gone');
            return false;
        }
        this._showView(trip, message);
        return true;
    }

    /**
     * End the trip: forget it, emit network_view_closed, then (one tick later) call its
     * returnTo({ reason }) unless a minigame is open by then.
     */
    async leave(reason = 'closed') {
        const trip = this.trip;
        if (!trip) return false;
        this.trip = null;
        this._emit('network_view_closed', { footholdId: trip.footholdId ?? null, reason }, trip.footholdId);
        await nextTick();
        if (trip.returnTo && !minigameOpen()) {
            try { trip.returnTo({ reason }); } catch (e) { console.warn('[network-links] returnTo threw', e); }
        }
        return true;
    }

    /**
     * A network screen closed: `screen` is view | signin | desktop | share, `reason` why
     * (close unless the closing path set another: handover, switch, item, share, sign_out,
     * no_session, unreachable, link_dropped, displaced, foothold_gone). `detail` may name
     * { pcId, host }. Looks the pair up in the landing table of 4.3. Resolves to the
     * landing taken, for tests.
     */
    landed(screen, reason = 'close', detail = {}) {
        if (!this.trip) return { landing: 'none' };
        const row = LANDINGS[screen];
        const decide = row ? (row[reason] || row.close) : null;
        const out = decide ? decide(this, detail || {}) : null;
        if (!out) return { landing: 'handover' };
        if (out.leave) {
            if (out.message) toast(out.message, 'info');
            this.leave(out.leave);
            return { landing: 'world', reason: out.leave };
        }
        if (out.desktop) {
            const startDesktop = win().openRemoteDesktop;
            const footholdId = this.trip.footholdId;
            nextTick().then(() => {
                if (minigameOpen()) return;
                if (typeof startDesktop === 'function') startDesktop(out.desktop, footholdId);
                else this.resume();
            });
            return { landing: 'desktop', pcId: out.desktop };
        }
        this.resume(out.message || null);
        return { landing: 'view', message: out.message || null };
    }
}

export const networkLinks = new NetworkLinks();
if (typeof window !== 'undefined') window.networkLinks = networkLinks;

export default networkLinks;
