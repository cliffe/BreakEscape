/**
 * Pure choice of the room ambient loop (OFFICE_LIFE_PLAN 12.6, slice 20). Called by
 * core/rooms.js recalculateAmbientVolume; no Phaser, no window, so node tests import it.
 *
 * In: rooms (scenario rooms, in rooms order: [[roomId, roomData], ...] or an object),
 * playerRoom (id or null), link(roomId) -> { adjacent, open } for roomId against the player's
 * room, roomTone (the scenario flag), profileFor(roomId) -> { bed, level } or null, and
 * isLoaded(key) -> bool.
 * Out: { key, level, step } to play, { key: null, step: 4 } for silence (fade the current loop
 * out), or { keep: true } (a null room under roomTone: leave the bed as it is).
 *
 * Without roomTone this is exactly the old loop: the first room in rooms order with an
 * ambientSound that is the player's room (its ambientVolume) or adjacent (0.125 open, 0.01 shut).
 */
export const OPEN_BLEED = 0.125;
export const SHUT_BLEED = 0.01;

export function chooseAmbient({ rooms = [], playerRoom = null, link = () => ({}), roomTone = false,
    profileFor = () => null, isLoaded = () => true } = {}) {
    const order = Array.isArray(rooms) ? rooms : Object.entries(rooms || {});
    if (!roomTone) {
        for (const [roomId, rd] of order) {
            if (!rd?.ambientSound) continue;
            if (playerRoom === roomId) return { key: rd.ambientSound, level: rd.ambientVolume ?? 1.0, step: 1 };
            const l = link(roomId) || {};
            if (l.adjacent) return { key: rd.ambientSound, level: l.open ? OPEN_BLEED : SHUT_BLEED, step: 3 };
        }
        return { key: null, step: 4 };
    }
    if (!playerRoom) return { keep: true };
    const own = order.find(([id]) => id === playerRoom)?.[1];
    // 1. the room's own authored loop (a key not loaded is no bed: next step)
    if (own?.ambientSound && isLoaded(own.ambientSound)) return { key: own.ambientSound, level: own.ambientVolume ?? 1.0, step: 1 };
    // 2. the room's profile bed
    const p = profileFor(playerRoom);
    if (p?.bed && isLoaded(p.bed)) return { key: p.bed, level: p.level ?? 1.0, step: 2 };
    // 3. an adjacent room's authored loop: an open door first, then rooms order
    let shut = null;
    for (const [roomId, rd] of order) {
        if (roomId === playerRoom || !rd?.ambientSound || !isLoaded(rd.ambientSound)) continue;
        const l = link(roomId) || {};
        if (!l.adjacent) continue;
        if (l.open) return { key: rd.ambientSound, level: OPEN_BLEED, step: 3 };
        if (!shut) shut = { key: rd.ambientSound, level: SHUT_BLEED, step: 3 };
    }
    // 4. nothing
    return shut || { key: null, step: 4 };
}
