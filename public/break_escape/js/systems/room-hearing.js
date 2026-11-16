/**
 * How loud a room's sounds are where the player is: the player's own room 1, a room joined to
 * it by a door 0.4, anywhere else 0. Shared by the lighting system (tube clicks) and the NPC
 * office visuals (use sounds, OFFICE_LIFE_PLAN 2.12); a helper because window.lightingSystem
 * is null in a scenario without lighting. No imports, so test harness copies stay simple.
 */
export const THROUGH_DOOR = 0.4;

export function hearingLevel(roomId,
    playerRoom = (typeof window !== 'undefined' ? window.currentPlayerRoom : undefined),
    rooms = (typeof window !== 'undefined' ? window.rooms : undefined)) {
    if (!roomId || roomId === playerRoom) return 1;
    const doors = rooms?.[playerRoom]?.doorSprites || [];
    return doors.some(d => d.doorProperties?.connectedRoom === roomId) ? THROUGH_DOOR : 0;
}

/**
 * Pure: the hearing factor for a desk phone's ring (user's decision, 2026-11-07, OFFICE_LIFE_PLAN 12.5):
 * 1 in the player's own room, THROUGH_DOOR (0.4) from a room joined to it by a connection whose door
 * is open (a door that was opened loses its sprite on both sides, so no sprite counts as open), 0 with
 * the door shut, in a room that is not adjacent, or with no known room. `rooms` is window.rooms,
 * `connections` the player's room's scenario connections.
 */
export function openDoorHearing(roomId, playerRoom, rooms = {}, connections = {}) {
    if (!roomId || !playerRoom) return 0;
    if (roomId === playerRoom) return 1;
    const linked = Object.values(connections || {}).some(v => (Array.isArray(v) ? v : [v]).includes(roomId));
    if (!linked) return 0;
    const shut = [playerRoom, roomId].some(r => (rooms?.[r]?.doorSprites || [])
        .some(d => d && d.active !== false && d.doorProperties && d.doorProperties.connectedRoom === (r === playerRoom ? roomId : playerRoom) && !d.doorProperties.open));
    return shut ? 0 : THROUGH_DOOR;
}


// Chatter volume (D34): full up to NEAR px, a straight line down to FLOOR at FAR px, FLOOR beyond.
export const CHATTER_NEAR = 160;   // the earshot radius (npc-needs OVERHEAR_RADIUS)
export const CHATTER_FAR = 480;    // 3 x NEAR
export const CHATTER_FLOOR = 0.15;

/** Pure: a chatter line's volume at distance `d` px from the speaker (same room); 1 when unknown. */
export function chatterVolume(d, { near = CHATTER_NEAR, far = CHATTER_FAR, floor = CHATTER_FLOOR } = {}) {
    if (!Number.isFinite(d)) return 1;
    if (d <= near) return 1;
    if (d >= far) return floor;
    return 1 - (1 - floor) * ((d - near) / (far - near));
}

/**
 * Is a person-chat or phone-chat open? Used by room tone (duck the bed) and by chatter (nobody
 * overhears, voices or toasts chatter while the player is in a conversation). Read the open
 * minigame, not `currentConversationMinigameType` alone: that stays 'phone-chat' after a call
 * closes, because only person-chat clears it. `w` is the window (injectable for tests).
 */
export function conversationOpen(w = (typeof window !== 'undefined' ? window : {})) {
    const mg = w.MinigameFramework?.currentMinigame;
    if (!mg) return false;
    return /PersonChat|PhoneChat/.test(mg.constructor?.name || '') || ['person-chat', 'phone-chat'].includes(w.currentConversationMinigameType);
}
