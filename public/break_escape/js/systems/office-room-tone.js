/**
 * Room tone (OFFICE_LIFE_PLAN 12.6, slice 20). Installs only when the scenario sets
 * "roomTone": true. It owns the profile table (js/data/room-tones.json) that core/rooms.js asks
 * for a room's bed (through systems/ambient-choice.js), and per frame (throttled):
 *   - the duck: the bed and the typing loop at half while a needs line the player hears is
 *     playing (npc-needs.js _heardUntil, set by _speak for an overheard line or call) or a
 *     conversation minigame is open; no spot starts meanwhile;
 *   - typing: the typing_loop while seated NPCs in the player's room work (seating.js publishes
 *     window.officeTypists), louder with more of them, capped at three;
 *   - background spots: every SPOT_SLOT_MS of needs clock a seeded roll for the player's room may
 *     play one of its profile's spots, filtered by what the room holds; heard only in that room;
 *   - room_tone_started:<roomId>, once per room, when the room's own bed (step 1 or 2) first plays.
 * startSound and outputSound are played by npc-office-visuals.js under the same gate.
 */
import { seededRoll } from './npc-needs.js';
import { roomToneOn, USE_SOUND_SCALE } from './npc-office-visuals.js';

export { roomToneOn };
export const SPOT_SLOT_MS = 20000;
export const SPOT_CHANCE = 0.5;
export const TYPING_LEVELS = [0, 0.4, 0.6, 0.75];   // by typists in the room, capped at three
export const DUCK = 0.5;
export const POLL_MS = 250;
const SPOT_SCALE = { copier_run: 0.6, distant_phone: 0.5 };
const COPIER_TYPES = ['photocopier', 'photocopier1'];

const win = () => (typeof window !== 'undefined' ? window : {});
let TABLE = null;

export function setRoomToneTable(t) { TABLE = t && typeof t === 'object' ? t : null; return TABLE; }
export function roomToneTable() { return TABLE; }

export async function loadRoomTones(fetchFn = (typeof fetch === 'function' ? fetch : null)) {
    if (TABLE) return TABLE;
    if (!fetchFn) return null;
    const res = await fetchFn(new URL('../data/room-tones.json', import.meta.url).href);
    if (!res.ok) throw new Error(`room tones: HTTP ${res.status}`);
    return setRoomToneTable(await res.json());
}

/** Pure: a room type's profile id: the scenario's roomToneTypes map first, then the table's exact type, else null. */
export function profileIdFor(roomType, scenario, table = TABLE) {
    if (typeof roomType !== 'string' || !table) return null;
    const mapped = scenario?.roomToneTypes?.[roomType];
    if (typeof mapped === 'string') return table.profiles?.[mapped] ? mapped : null;
    return table.types?.[roomType] || null;
}

/** Pure: a room's profile { id, bed, level, typing, spots } or null (no table yet: null, so no bed). */
export function profileForRoom(roomId, scenario, table = TABLE) {
    const id = profileIdFor(scenario?.rooms?.[roomId]?.type, scenario, table);
    const p = id ? table.profiles[id] : null;
    return p ? { id, ...p } : null;
}

/** Pure: the typing loop's level for this many typists. */
export function typingLevel(count) {
    const n = Math.max(0, Math.min(TYPING_LEVELS.length - 1, Math.floor(Number(count) || 0)));
    return TYPING_LEVELS[n];
}

/** Pure: duck while a heard line plays or a conversation (person-chat, phone-chat) is open. */
export function duckWanted({ clockMs = 0, heardUntil = 0, chatOpen = false } = {}) {
    return !!chatOpen || (Number(heardUntil) > Number(clockMs));
}

/**
 * Pure: the background spot for a room in a needs-clock slot, or null. `holds` says what the room
 * has: { copier, deskPhone }. The roll is seededRoll(seed, roomId, 'tone:' + slot).
 */
export function spotFor({ seed, roomId, slot, profile, holds = {} }) {
    if (!profile || !roomId) return null;
    const list = (profile.spots || []).filter(k => (k !== 'copier_run' || holds.copier) && (k !== 'distant_phone' || !holds.deskPhone));
    if (!list.length) return null;
    if (seededRoll(seed, roomId, `tone:${slot}`) >= SPOT_CHANCE) return null;
    return list[Math.floor(seededRoll(seed, roomId, `tone:${slot}:pick`) * list.length) % list.length];
}

/** Pure: seated typists in a room from seating's npcId -> roomId map. */
export function typistsIn(map, roomId) {
    let n = 0;
    if (map && roomId) for (const r of map.values()) if (r === roomId) n++;
    return n;
}

export class OfficeRoomTone {
    constructor(scene = null) {
        this.scene = scene;
        this.started = new Set();
        this.lastSlot = null;
        this.lastPoll = -Infinity;
        this.ducked = false;
        this.typing = 0;
        this.log = [];   // [{ t, what, ... }] for live checks
    }

    profileFor(roomId) { return profileForRoom(roomId, win().gameScenario); }

    _note(e) { this.log.push({ t: Date.now(), ...e }); if (this.log.length > 300) this.log.shift(); }

    chatOpen() {
        const w = win();
        const mg = w.MinigameFramework?.currentMinigame;
        if (!mg) return false;
        return /PersonChat|PhoneChat/.test(mg.constructor?.name || '') || ['person-chat', 'phone-chat'].includes(w.currentConversationMinigameType);
    }

    holds(roomId) {
        const objs = win().rooms?.[roomId]?.objects || {};
        const out = { copier: null, deskPhone: false };
        for (const sp of Object.values(objs)) {
            const sd = sp?.scenarioData;
            if (!sd || sp.destroyed) continue;
            if (!out.copier && (sd.officeType === 'copier' || COPIER_TYPES.includes(sd.type))) out.copier = sp;
            if (typeof sd.phoneOwner === 'string') out.deskPhone = true;
        }
        return out;
    }

    update(now = Date.now()) {
        if (now - this.lastPoll < POLL_MS) return;
        this.lastPoll = now;
        const w = win();
        const sm = w.soundManager;
        const sys = w.npcNeedsSystem;
        if (!sm || sm.ambienceSuppressed) return;
        const room = w.currentPlayerRoom || null;

        const duck = duckWanted({ clockMs: sys?.clockMs, heardUntil: sys?._heardUntil, chatOpen: this.chatOpen() });
        if (duck !== this.ducked) {
            this.ducked = duck;
            sm.setAmbientDuck?.(duck ? DUCK : 1);
            this._note({ what: 'duck', on: duck, room });
        }

        // A doorway (no room) keeps the typing as it is, like the bed
        if (room) {
            const p = this.profileFor(room);
            const n = p?.typing ? Math.min(3, typistsIn(w.officeTypists, room)) : 0;
            if (n !== this.typing) {
                this.typing = n;
                sm.fadeLoopTo?.('typing_loop', typingLevel(n), 400);
                this._note({ what: 'typing', count: n, level: typingLevel(n), room });
            }
        }

        const c = w.ambientChoice;
        if (room && c && c.room === room && (c.step === 1 || c.step === 2) && c.key && sm.currentAmbient === c.key && !this.started.has(room)) {
            this.started.add(room);
            this._note({ what: 'started', room, key: c.key, level: c.level, step: c.step });
            w.eventDispatcher?.emit?.(`room_tone_started:${room}`, { roomId: room, key: c.key, level: c.level, step: c.step });
        }

        if (sys && Number.isFinite(sys.clockMs)) {
            const slot = Math.floor(sys.clockMs / SPOT_SLOT_MS);
            if (this.lastSlot === null) this.lastSlot = slot;
            if (slot !== this.lastSlot) {
                this.lastSlot = slot;
                if (room && !this.ducked) this.playSpot(room, slot, sys.seed);
            }
        }
    }

    playSpot(roomId, slot, seed) {
        const w = win();
        const holds = this.holds(roomId);
        const key = spotFor({ seed, roomId, slot, profile: this.profileFor(roomId), holds });
        if (!key) return null;
        const vis = w.npcOfficeVisuals;
        const at = key === 'copier_run' && holds.copier ? holds.copier : w.player;
        if (!vis || !at) return null;
        const v = vis.playAt(key, at.x, at.y, roomId, { spot: true, slot },
            { ownRoomOnly: true, channel: 'tone', scale: USE_SOUND_SCALE * (SPOT_SCALE[key] ?? 0.5) });
        this._note({ what: 'spot', key, room: roomId, slot, volume: Math.round(v * 1000) / 1000 });
        return key;
    }
}

export function installOfficeRoomTone(scene) {
    const w = win();
    if (!roomToneOn()) return null;
    if (!w.officeRoomTone) w.officeRoomTone = new OfficeRoomTone(scene);
    const inst = w.officeRoomTone;
    if (scene && inst.hooked !== scene) {
        inst.scene = scene;
        inst.hooked = scene;
        scene.events?.on?.('postupdate', () => { try { inst.update(); } catch (e) { /* never break a frame */ } });
    }
    // The first room change runs before the table loads: a bed at spawn needs a recalculation now
    loadRoomTones().then(() => { inst._note({ what: 'table' }); w.refreshAmbient?.(); })
        .catch(e => console.warn('room tones failed to load', e));
    return inst;
}
